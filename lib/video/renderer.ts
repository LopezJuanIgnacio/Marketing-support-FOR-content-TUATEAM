import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import OpenAI from 'openai';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Downloads a file from a URL to a local path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  if (url.startsWith('/')) {
    const localFilePath = path.join(process.cwd(), 'public', url.slice(1));
    const buffer = fs.readFileSync(localFilePath);
    fs.writeFileSync(destPath, buffer);
    return;
  }

  if (url.includes('.s3.') && url.includes('amazonaws.com')) {
    const parsedUrl = new URL(url);
    const bucketName = parsedUrl.hostname.split('.s3.')[0];
    const objectKey = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''));

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    );

    if (!response.Body) {
      throw new Error(`Empty S3 object body for ${url}`);
    }

    const bytes = await response.Body.transformToByteArray();
    fs.writeFileSync(destPath, Buffer.from(bytes));
    return;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
  }
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

function buildCameraPrompt(scene: any): string {
  const visualSuggestion = scene.visualSuggestion || '';
  const cameraType = (scene.cameraType || '').trim();
  const transition = (scene.transition || '').trim();

  return [
    `A highly detailed, cinematic, and professional shot for a video.`,
    visualSuggestion,
    cameraType ? `Camera type: ${cameraType}.` : '',
    transition ? `Scene transition style: ${transition}.` : '',
    'No text or watermarks in the image.',
  ].filter(Boolean).join(' ');
}

function buildTransitionFilters(transition?: string, duration = 0): Array<{ filter: string; options: any }> {
  const normalized = (transition || '').trim().toLowerCase();
  const fadeDuration = Math.min(0.5, Math.max(0.25, duration * 0.12));
  const fadeOutStart = Math.max(duration - fadeDuration, 0);

  if (!normalized || normalized === 'cut' || normalized === 'hard cut') {
    return [];
  }

  return [
    {
      filter: 'fade',
      options: `t=in:st=0:d=${fadeDuration}`,
    },
    {
      filter: 'fade',
      options: `t=out:st=${fadeOutStart}:d=${fadeDuration}`,
    },
  ];
}

type SubtitleBlock = {
  text: string;
  wrappedText: string;
  wordCount: number;
  charCount: number;
  start: number;
  end: number;
  filePath: string;
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitNarrationIntoBlocks(narration: string, duration: number): string[] {
  const cleaned = narration.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const totalWords = countWords(cleaned);
  const estimatedByLength = Math.ceil(cleaned.length / 58);
  const estimatedByWords = Math.ceil(totalWords / 8);
  const estimatedByDuration = Math.ceil(duration / 2.1);
  const desiredBlockCount = Math.max(1, estimatedByLength, estimatedByWords, estimatedByDuration);
  const targetChars = Math.max(28, Math.min(72, Math.round(cleaned.length / desiredBlockCount)));
  const hardCharLimit = Math.max(44, Math.min(88, targetChars + 16));
  const hardWordLimit = Math.max(7, Math.min(16, Math.ceil(targetChars / 4)));

  const clauses = cleaned.match(/[^.!?;:]+[.!?;:]*/g) ?? [cleaned];
  const blocks: string[] = [];
  let current = '';

  const flushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) blocks.push(trimmed);
    current = '';
  };

  const appendWord = (word: string) => {
    current = current ? `${current} ${word}` : word;
  };

  for (const clause of clauses) {
    const words = clause.trim().split(/\s+/).filter(Boolean);
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const candidateChars = candidate.length;
      const candidateWords = countWords(candidate);
      const punctuationBoundary = /[.!?;:,]$/.test(word);
      const clauseBoundary = /[.!?;:]$/.test(clause.trim());

      const shouldBreak = Boolean(current) && (
        candidateChars > hardCharLimit ||
        candidateWords > hardWordLimit ||
        (punctuationBoundary && current.length >= targetChars * 0.75 && countWords(current) >= 4) ||
        (clauseBoundary && current.length >= targetChars && countWords(current) >= 3)
      );

      if (shouldBreak) {
        flushCurrent();
        current = word;
      } else {
        appendWord(word);
      }
    }

    const clauseText = clause.trim();
    if (current && /[.!?]$/.test(clauseText) && current.length >= targetChars * 0.8) {
      flushCurrent();
    }
  }

  flushCurrent();

  if (blocks.length <= 1) {
    return blocks.length ? blocks : [cleaned];
  }

  const merged: string[] = [];
  for (const block of blocks) {
    if (!merged.length) {
      merged.push(block);
      continue;
    }

    const tooShort = block.length < 18 || countWords(block) < 3;
    const previous = merged[merged.length - 1];
    const canMerge = `${previous} ${block}`.trim().length <= hardCharLimit + 18;

    if (tooShort && canMerge) {
      merged[merged.length - 1] = `${previous} ${block}`.trim();
    } else {
      merged.push(block);
    }
  }

  return merged;
}

function wrapSubtitleBlock(text: string, maxLineLength = 34): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1 || text.length <= maxLineLength) {
    return text.trim();
  }

  let bestBreakIndex = -1;
  let bestBalance = Number.POSITIVE_INFINITY;

  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ');
    const right = words.slice(i).join(' ');
    if (left.length <= maxLineLength && right.length <= maxLineLength) {
      const balance = Math.abs(left.length - right.length);
      if (balance < bestBalance) {
        bestBalance = balance;
        bestBreakIndex = i;
      }
    }
  }

  if (bestBreakIndex > 0) {
    return `${words.slice(0, bestBreakIndex).join(' ')}\n${words.slice(bestBreakIndex).join(' ')}`;
  }

  let fallbackBreakIndex = 0;
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ');
    if (left.length <= maxLineLength) {
      fallbackBreakIndex = i;
    } else {
      break;
    }
  }

  if (fallbackBreakIndex > 0 && fallbackBreakIndex < words.length) {
    return `${words.slice(0, fallbackBreakIndex).join(' ')}\n${words.slice(fallbackBreakIndex).join(' ')}`;
  }

  return text.trim();
}

function allocateSubtitleTimings(blocks: Array<{ text: string; wordCount: number; charCount: number }>, duration: number): SubtitleBlock[] {
  if (!blocks.length) return [];

  const rawDurations = blocks.map((block) => {
    const spokenTime = block.wordCount / 2.3;
    const readingTime = block.charCount / 16;
    return Math.max(0.85, Math.min(4.0, Math.max(spokenTime, readingTime)));
  });

  const totalRaw = rawDurations.reduce((sum, value) => sum + value, 0) || 1;
  const scale = duration / totalRaw;
  const timings: SubtitleBlock[] = [];
  let cursor = 0;

  blocks.forEach((block, index) => {
    const targetDuration = index === blocks.length - 1
      ? Math.max(0, duration - cursor)
      : rawDurations[index] * scale;

    const start = cursor;
    const end = Math.min(duration, start + targetDuration);
    cursor = end;

    timings.push({
      ...block,
      wrappedText: wrapSubtitleBlock(block.text),
      start,
      end,
      filePath: '',
    });
  });

  return timings;
}

/**
 * Creates a video clip for a single scene using an image and text
 */
function createSceneClip(
  imagePath: string,
  narration: string,
  duration: number,
  outputPath: string,
  transition?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Normalize narration text
    const normalized = (narration || '').replace(/\s+/g, ' ').trim();

    const fontPath = os.platform() === 'win32' ? 'C:/Windows/Fonts/arial.ttf' : '/Windows/Fonts/arial.ttf';

    const segmentCandidates = splitNarrationIntoBlocks(normalized, duration).map((text) => ({
      text,
      wordCount: countWords(text),
      charCount: text.length,
    }));

    const segmentTimings = allocateSubtitleTimings(segmentCandidates, duration);
    const textFiles: string[] = [];

    segmentTimings.forEach((seg, idx) => {
      const segFile = `${outputPath}.seg${idx}.txt`;
      fs.writeFileSync(segFile, seg.wrappedText);
      textFiles.push(segFile);

      seg.filePath = segFile;
    });

    const baseFilters: Array<{ filter: string; options: any }> = [
      { filter: 'scale', options: '1920:1080:force_original_aspect_ratio=increase' },
      { filter: 'crop', options: '1920:1080' },
      ...buildTransitionFilters(transition, duration),
    ];

    // Build drawtext filters for each subtitle segment with enable between start and end
    const drawTextFilters = segmentTimings.map((seg) => ({
      filter: 'drawtext',
      options: {
        fontfile: `'${fontPath.replace(/:/g, '\\:')}'`,
        textfile: `'${seg.filePath.replace(/\\/g, '/').replace(/:/g, '\\:')}'`,
        fontcolor: 'white',
        fontsize: 48,
        box: 1,
        boxcolor: 'black@0.5',
        boxborderw: 10,
        x: '(w-text_w)/2',
        y: 'h-th-50',
        enable: `between(t,${seg.start.toFixed(3)},${seg.end.toFixed(3)})`
      }
    }));

    const videoFilters: Array<{ filter: string; options: any }> = [...baseFilters, ...drawTextFilters];

    ffmpeg()
      .input(imagePath)
      .loop(duration)
      .videoFilters(videoFilters)
      .outputOptions(['-c:v libx264', '-t ' + duration, '-pix_fmt yuv420p'])
      .on('end', () => {
        // cleanup temp text files
        try { textFiles.forEach(f => fs.unlinkSync(f)); } catch (e) {}
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error creating scene clip:', err);
        try { textFiles.forEach(f => fs.unlinkSync(f)); } catch (e) {}
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
      const prompt = buildCameraPrompt(scene);
      
      let imageUrl: string | null = null;
      try {
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "high",
        });
        const generatedImage = response.data?.[0];

        if (generatedImage?.b64_json) {
          imageUrl = generatedImage.b64_json;
        } else if (generatedImage?.url) {
          imageUrl = generatedImage.url;
        } else {
          throw new Error("OpenAI image response did not include image data");
        }
      } catch (err: any) {
        console.warn(`[Warning] OpenAI Image generation failed for scene ${i + 1}: ${err.message}. Falling back to placeholder.`);
      }

      const imagePath = path.join(workDir, `image_${i}.png`);
      
      if (imageUrl) {
        // 2b. Save OpenAI image data or download a hosted image
        if (imageUrl.startsWith('data:image/')) {
          const base64Data = imageUrl.split(',')[1];
          fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
        } else if (/^[A-Za-z0-9+/=]+$/.test(imageUrl) && imageUrl.length > 100) {
          fs.writeFileSync(imagePath, Buffer.from(imageUrl, 'base64'));
        } else {
          await downloadFile(imageUrl, imagePath);
        }
      } else {
        // Fallback: use a free AI image generator (Pollinations.ai)
        console.log(`Using Pollinations.ai fallback for scene ${i + 1}`);
        const fallbackPrompt = encodeURIComponent(`Cinematic, detailed, no text. ${scene.visualSuggestion}`);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=1920&height=1080&nologo=true`;
        
        try {
          await downloadFile(pollinationsUrl, imagePath);
        } catch (fallbackErr) {
          console.error("Fallback image generation also failed, using solid black.", fallbackErr);
          // Absolute last resort: solid black placeholder
          await new Promise<void>((resolve, reject) => {
            ffmpeg()
              .input('color=c=black:s=1920x1080')
              .inputFormat('lavfi')
              .outputOptions(['-frames:v 1'])
              .save(imagePath)
              .on('end', () => resolve())
              .on('error', (err) => reject(err));
          });
        }
      }

      // 2c. Create video clip
      const duration = parseDuration(scene.duration);
      const clipPath = path.join(workDir, `clip_${i}.mp4`);
      
      // Use full narration for timed subtitle segments. Keep a short on-screen text fallback.
      const screenText = scene.textOnScreen || (scene.narration ? scene.narration.substring(0, 50) + "..." : "");
      const narrationText = scene.narration || screenText;

      await createSceneClip(imagePath, narrationText, duration, clipPath, scene.transition);
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
