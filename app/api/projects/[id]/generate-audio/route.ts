import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateAudio, AudioGenerationOptions } from "@/lib/elevenlabs";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, getPresignedUrl } from "@/lib/s3";
import { mkdir, writeFile, unlink } from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import os from "os";
import { join } from "path";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

async function persistAudioFallback(buffer: Buffer, fileName: string) {
  const publicAudioDir = join(process.cwd(), "public", "generated-audio");
  await mkdir(publicAudioDir, { recursive: true });
  await writeFile(join(publicAudioDir, fileName), buffer);
  return `/generated-audio/${fileName}`;
}

async function getAudioDurationSeconds(buffer: Buffer, fileName: string): Promise<number> {
  const tempPath = join(os.tmpdir(), `${Date.now()}-${fileName}`);
  await writeFile(tempPath, buffer);

  try {
    return await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(tempPath, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data.format?.duration ?? 0);
      });
    });
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const body = await request.json();
    const { voiceType, tone } = body as AudioGenerationOptions;

    if (!voiceType || !tone) {
      return NextResponse.json({ error: "Voice type and tone are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { videoProject: true },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    if (!project.videoProject || !project.videoProject.storyboard) {
      return NextResponse.json({ error: "Storyboard is required to generate audio" }, { status: 400 });
    }

    let storyboardData;
    try {
      storyboardData = JSON.parse(project.videoProject.storyboard);
    } catch (e) {
      return NextResponse.json({ error: "Invalid storyboard format" }, { status: 400 });
    }

    const scenes = storyboardData.scenes || [];
    if (scenes.length === 0) {
      return NextResponse.json({ error: "No scenes found in storyboard" }, { status: 400 });
    }

    // Collect all narrations
    const audioBuffers: Buffer[] = [];
    const sceneDurations: number[] = [];
    
    for (const scene of scenes) {
      const text = scene.narration?.trim();
      if (text) {
        try {
          const buffer = await generateAudio(text, { voiceType, tone });
          audioBuffers.push(buffer);
          sceneDurations.push(await getAudioDurationSeconds(buffer, `scene-${scene.sceneNumber || audioBuffers.length}.mp3`));
        } catch (error) {
          console.error(`Error generating audio for scene ${scene.sceneNumber}:`, error);
          // If one fails, we throw an error instead of generating partial audio
          throw new Error("Failed to generate audio for one or more scenes");
        }
      }
    }

    if (audioBuffers.length === 0) {
      return NextResponse.json({ error: "No narration text found across all scenes" }, { status: 400 });
    }

    // Concatenate all audio buffers
    const combinedBuffer = Buffer.concat(audioBuffers);

    const storyboardWithDurations = {
      ...storyboardData,
      scenes: scenes.map((scene: any, index: number) => ({
        ...scene,
        durationFromAudio: true,
        duration: `${Math.max(sceneDurations[index] || 0, 0.5).toFixed(2)}s`,
      })),
    };
    
    // Upload combined audio to S3
    const fileName = `${Date.now()}-voiceover.mp3`;
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "pdfvideo-bucket";
    const objectKey = `projects/${project.id}/audio/${fileName}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: combinedBuffer,
      ContentType: "audio/mpeg",
    });

    let audioUrl: string;
    try {
      await s3Client.send(uploadCommand);
      audioUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${objectKey}`;
    } catch (uploadError: any) {
      const errorCode = uploadError?.name || uploadError?.Code || uploadError?.code;
      const errorMessage = String(uploadError?.message || "");

      if (errorCode !== "InvalidToken" && !errorMessage.includes("InvalidToken")) {
        throw uploadError;
      }

      console.warn("S3 upload failed with InvalidToken, storing audio locally instead.", uploadError);
      audioUrl = await persistAudioFallback(combinedBuffer, fileName);
    }

    // Update the database
    const videoProject = await prisma.videoProject.update({
      where: { projectId: projectId },
      data: {
        audioUrl: audioUrl,
        storyboard: JSON.stringify(storyboardWithDurations),
      },
    });

    const presignedAudioUrl = await getPresignedUrl(audioUrl);

    return NextResponse.json({ success: true, audioUrl: presignedAudioUrl, videoProject });
  } catch (error: any) {
    console.error("Error generating/uploading audio:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process audio generation" },
      { status: 500 }
    );
  }
}
