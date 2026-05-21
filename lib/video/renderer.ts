import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import OpenAI from 'openai';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Downloads a file from a URL to a local path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
}

/**
 * Parses duration string like "5s" into a number of seconds. Falls back to 5.
 */
function parseDuration(durationStr?: string): number {
  if (!durationStr) return 5;
  const num = parseFloat(durationStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 5 : num;
}

/**
 * Creates a video clip for a single scene using an image and text
 */
function createSceneClip(
  imagePath: string, 
  text: string, 
  duration: number, 
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Escape text for FFmpeg drawtext filter
    const escapedText = text
      .replace(/\\/g, '\\\\')
      .replace(/\'/g, "\\'")
      .replace(/\:/g, '\\:')
      .match(/.{1,40}(?:\s|$)/g)?.join('\n') || text; // Word wrap at ~40 chars

    ffmpeg()
      .input(imagePath)
      .loop(duration) // Loop the single image
      .outputOptions([
        '-c:v libx264',
        '-t ' + duration,
        '-pix_fmt yuv420p',
        '-vf scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080' + 
        `,drawtext=fontfile=/Windows/Fonts/arial.ttf:text='${escapedText}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-th-50`
      ])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => {
        console.error('Error creating scene clip:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Concatenates multiple video clips into one
 */
function concatenateClips(clipPaths: string[], outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    clipPaths.forEach(clip => {
      command.input(clip);
    });

    command
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .mergeToFile(outputPath, os.tmpdir());
  });
}

/**
 * Merges video and audio
 */
function mergeVideoAudio(videoPath: string, audioPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v copy',
        '-c:a aac',
        '-shortest' // Finish encoding when the shortest input stream ends
      ])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

export async function generateVideo(storyboard: any, audioUrl: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const sessionId = Date.now().toString();
  const workDir = path.join(tmpDir, `video_gen_${sessionId}`);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    const scenes = storyboard.scenes || [];
    const clipPaths: string[] = [];

    // 1. Download the global audio
    const localAudioPath = path.join(workDir, 'audio.mp3');
    await downloadFile(audioUrl, localAudioPath);

    // 2. Process each scene
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`Processing scene ${i + 1}/${scenes.length}...`);

      // 2a. Generate image via OpenAI
      const prompt = `A highly detailed, cinematic, and professional shot for a video. ${scene.visualSuggestion}. No text or watermarks in the image.`;
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data[0].url;
      if (!imageUrl) throw new Error(`Failed to generate image for scene ${i + 1}`);

      // 2b. Download image
      const imagePath = path.join(workDir, `image_${i}.jpg`);
      await downloadFile(imageUrl, imagePath);

      // 2c. Create video clip
      const duration = parseDuration(scene.duration);
      const clipPath = path.join(workDir, `clip_${i}.mp4`);
      
      // Use short text for screen, or fallback to narration snippet
      const screenText = scene.textOnScreen || (scene.narration ? scene.narration.substring(0, 50) + "..." : "");
      
      await createSceneClip(imagePath, screenText, duration, clipPath);
      clipPaths.push(clipPath);
    }

    // 3. Concatenate all clips
    console.log("Concatenating clips...");
    const concatenatedVideoPath = path.join(workDir, 'concatenated.mp4');
    await concatenateClips(clipPaths, concatenatedVideoPath);

    // 4. Merge with audio
    console.log("Merging audio and video...");
    const finalVideoPath = path.join(workDir, 'final.mp4');
    await mergeVideoAudio(concatenatedVideoPath, localAudioPath, finalVideoPath);

    return finalVideoPath;

  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
  // Note: We don't delete the workDir here so the caller can read the final video.
  // The API route should clean up the directory after uploading to S3.
}
