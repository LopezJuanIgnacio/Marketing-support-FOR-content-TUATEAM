import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = "gpt-4o-mini";

export interface AIResponse {
  [key: string]: any;
}

export interface LanguageDetection {
  code?: string;
  language?: string;
}

/**
 * Generic function to call OpenAI with JSON output
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<AIResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate content from AI");
  }
}

/**
 * Detects the language of the provided text. Returns an object with ISO code and language name.
 */
export async function detectLanguage(text: string): Promise<LanguageDetection> {
  try {
    const sample = (text || '').slice(0, 4000); // limit size
    const systemPrompt = `You are a precise language detection tool. Given the user's text, return a JSON object with 'code' (ISO 639-1 language code) and 'language' (English name of the language). Do not include anything else.`;
    const result = await callAI(systemPrompt, sample);
    return {
      code: result.code || result.language_code || result.lang || undefined,
      language: result.language || result.lang_name || undefined,
    };
  } catch (err) {
    console.warn('Language detection failed, defaulting to English:', err);
    return { code: 'en', language: 'English' };
  }
}

/**
 * Generates a summary of the document content
 */
export async function generateSummary(documentText: string, userPreferences: string = "", language?: string): Promise<AIResponse> {
  let systemPrompt = `You are a professional content analyst. 
  Summarize the core message and key points of the provided text. 
  The output must be a JSON object with 'title', 'summary' (short), 'keyPoints' (array of strings), 'detectedTopics' (array of strings), and 'videoAngles' (array of strings).
  Base your analysis strictly on the provided content.
  User Preferences: ${userPreferences}`;

  if (language) {
    systemPrompt += `\nRespond in the following language: ${language}.`;
  }

  return callAI(systemPrompt, documentText);
}

/**
 * Generates creative story angles for a video
 */
export async function generateStories(documentText: string, userPreferences: string = "", language?: string): Promise<AIResponse> {
  let systemPrompt = `You are a creative storyteller. 
  Generate 3 to 5 unique story angles or narrative approaches for a short video based on the document text. 
  The output must be a JSON object with a 'stories' array. Each story should have 'title', 'narrativeAngle', 'targetAudience', and 'recommendedTone'.
  Base your stories strictly on the provided content.
  User Preferences: ${userPreferences}`;

  if (language) systemPrompt += `\nRespond in the following language: ${language}.`;

  return callAI(systemPrompt, documentText);
}

/**
 * Generates a full video script
 */
export async function generateScript(documentText: string, storyContext: string = "", language?: string): Promise<AIResponse> {
  let systemPrompt = `You are a professional scriptwriter. 
  Create a video script based on the provided content and the selected narrative story approach. 
  The output must be a JSON object with 'videoTitle', 'hook', and 'scenes' (array). 
  Each scene MUST be a fully populated object with 'sceneNumber', 'narration' (the spoken text), 'textOnScreen', and 'cta'.
  IMPORTANT: Do not include empty scenes, blank objects, or null values in the 'scenes' array. Every item must have actual content.
  Base your script strictly on the provided content.
  Selected Story Context: ${storyContext}`;

  if (language) systemPrompt += `\nRespond in the following language: ${language}.`;

  return callAI(systemPrompt, documentText);
}

/**
 * Generates a storyboard with visual descriptions
 */
export async function generateStoryboard(scriptContext: string, language?: string): Promise<AIResponse> {
  let systemPrompt = `You are a visual director. 
  Create a storyboard for a video based on the provided script. 
  The output must be a JSON object with 'scenes' (array). 
  Each scene MUST be a fully populated object with 'sceneNumber', 'narration' (from the script), 'visualSuggestion' (detailed for AI image generation), 'cameraType' (e.g. wide shot, close up), and 'transition'.
  Duration is calculated automatically later from the generated audio, so do not treat it as a user-editable field.
  IMPORTANT: Do not include empty scenes, blank objects, or null values in the 'scenes' array. Every item must have actual content.
  Base your storyboard strictly on the provided script.`;

  if (language) systemPrompt += `\nRespond in the following language: ${language}.`;

  return callAI(systemPrompt, scriptContext);
}
