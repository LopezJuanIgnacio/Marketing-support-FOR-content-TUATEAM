export interface AudioGenerationOptions {
  voiceType: "male" | "female";
  tone: "professional" | "casual";
}

// Map logical voice selections to specific ElevenLabs Voice IDs.
// These can be overridden per-environment for accounts that use custom voices.
const DEFAULT_VOICE_IDS = {
  male: {
    professional: "JBFqnCBsd6RMkjVDRZzb", // George
    casual: "ErXwobaYiN019PkySvjV", // Antoni
  },
  female: {
    professional: "EXAVITQu4vr4xnSDxMaL", // Bella
    casual: "MF3mGyEYCl7XYWbV9V6O", // Elli
  },
};

const FALLBACK_VOICE_ID = process.env.ELEVENLABS_FALLBACK_VOICE_ID || DEFAULT_VOICE_IDS.male.professional;

function getConfiguredVoiceId(options: AudioGenerationOptions) {
  const envKey = `ELEVENLABS_${options.voiceType.toUpperCase()}_${options.tone.toUpperCase()}_VOICE_ID`;
  return process.env[envKey] || DEFAULT_VOICE_IDS[options.voiceType][options.tone];
}

async function requestAudio(apiKey: string, text: string, voiceId: string) {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });
}

/**
 * Generates an audio buffer from text using the ElevenLabs API
 */
export async function generateAudio(text: string, options: AudioGenerationOptions): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured in the environment.");
  }

  const primaryVoiceId = getConfiguredVoiceId(options);
  const voiceIdsToTry = primaryVoiceId === FALLBACK_VOICE_ID ? [primaryVoiceId] : [primaryVoiceId, FALLBACK_VOICE_ID];

  for (const voiceId of voiceIdsToTry) {
    const response = await requestAudio(apiKey, text, voiceId);

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    const errorData = await response.text();
    console.error("ElevenLabs API error:", errorData);

    const isMissingVoice = response.status === 404 && errorData.includes("voice_not_found");
    if (!isMissingVoice || voiceId === FALLBACK_VOICE_ID) {
      throw new Error(`Failed to generate audio from ElevenLabs: ${response.statusText}`);
    }

    console.warn(`Voice ID ${voiceId} was not found. Retrying with fallback voice ID ${FALLBACK_VOICE_ID}.`);
  }

  throw new Error("Failed to generate audio from ElevenLabs: no voice IDs were available.");
}
