import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateVideo } from "@/lib/video/renderer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, getPresignedUrl } from "@/lib/s3";
import fs from "fs";
import path from "path";

// Set max duration for this specific route to 5 minutes on Vercel
export const maxDuration = 300; 
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { videoProject: true },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    if (!project.videoProject || !project.videoProject.storyboard || !project.videoProject.audioUrl) {
      return NextResponse.json(
        { error: "Storyboard and Audio are required to generate the final video" }, 
        { status: 400 }
      );
    }

    let storyboardData;
    try {
      storyboardData = JSON.parse(project.videoProject.storyboard);
    } catch (e) {
      return NextResponse.json({ error: "Invalid storyboard format" }, { status: 400 });
    }

    // Generate video
    console.log("Starting video generation...");
    
    // We must presign the audio URL so the backend can download it
    const presignedAudioUrlForVideo = await getPresignedUrl(project.videoProject.audioUrl);
    if (!presignedAudioUrlForVideo) {
      return NextResponse.json({ error: "Failed to resolve audio URL" }, { status: 400 });
    }

    const videoFilePath = await generateVideo(storyboardData, presignedAudioUrlForVideo);
    
    // Read the generated video buffer
    const videoBuffer = fs.readFileSync(videoFilePath);

    // Upload to S3
    const fileName = `${Date.now()}-final-video.mp4`;
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "pdfvideo-bucket";
    const objectKey = `projects/${project.id}/video/${fileName}`;

    console.log("Uploading video to S3...");
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: videoBuffer,
      ContentType: "video/mp4",
    });

    await s3Client.send(uploadCommand);

    const videoUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${objectKey}`;

    // Update the database
    const videoProject = await prisma.videoProject.update({
      where: { projectId: projectId },
      data: {
        videoUrl: videoUrl,
      },
    });

    // Mark the project as completed so dashboard counters reflect the rendered video
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "completed" },
    });

    // Cleanup local temp directory
    try {
      const workDir = path.dirname(videoFilePath);
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Error cleaning up temp files:", cleanupError);
    }

    const presignedVideoUrl = await getPresignedUrl(videoUrl);

    return NextResponse.json({ success: true, videoUrl: presignedVideoUrl, videoProject });
  } catch (error: any) {
    console.error("Error generating/uploading video:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process video generation" },
      { status: 500 }
    );
  }
}
