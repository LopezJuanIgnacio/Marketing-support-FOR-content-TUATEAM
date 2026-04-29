import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = "gpt-4o-mini";

export interface AIResponse {
  [key: string]: any;
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
 * Generates a summary of the document content
 */
export async function generateSummary(documentText: string, userPreferences: string = ""): Promise<AIResponse> {
  const systemPrompt = `You are a professional content analyst. 
  Summarize the core message and key points of the provided text. 
  The output must be a JSON object with 'title', 'summary' (short), and 'keyPoints' (array of strings).
  Base your analysis strictly on the provided content.
  User Preferences: ${userPreferences}`;

  return callAI(systemPrompt, documentText);
}

/**
 * Generates creative story angles for a video
 */
export async function generateStories(documentText: string, userPreferences: string = ""): Promise<AIResponse> {
  const systemPrompt = `You are a creative storyteller. 
  Generate 3 unique story angles or narrative approaches for a short video based on the document text. 
  The output must be a JSON object with a 'stories' array. Each story should have 'angleName', 'narrative', and 'targetAudience'.
  Base your stories strictly on the provided content.
  User Preferences: ${userPreferences}`;

  return callAI(systemPrompt, documentText);
}

/**
 * Generates a full video script
 */
export async function generateScript(documentText: string, userPreferences: string = ""): Promise<AIResponse> {
  const systemPrompt = `You are a professional scriptwriter. 
  Create a video script based on the provided content. 
  The output must be a JSON object with 'title', 'totalEstimatedDuration', and 'scenes' (array). 
  Each scene should have 'sceneNumber', 'dialogue' or 'narration', and 'duration'.
  Base your script strictly on the provided content.
  User Preferences: ${userPreferences}`;

  return callAI(systemPrompt, documentText);
}

/**
 * Generates a storyboard with visual descriptions
 */
export async function generateStoryboard(documentText: string, userPreferences: string = ""): Promise<AIResponse> {
  const systemPrompt = `You are a visual director. 
  Create a storyboard for a video based on the provided content. 
  The output must be a JSON object with 'scenes' (array). 
  Each scene should have 'sceneNumber', 'visualDescription' (detailed for AI image generation), and 'mood'.
  Base your storyboard strictly on the provided content.
  User Preferences: ${userPreferences}`;

  return callAI(systemPrompt, documentText);
}
