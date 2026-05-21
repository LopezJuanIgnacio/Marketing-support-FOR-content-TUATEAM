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
  The output must be a JSON object with 'title', 'summary' (short), 'keyPoints' (array of strings), 'detectedTopics' (array of strings), and 'videoAngles' (array of strings).
  Base your analysis strictly on the provided content.
  User Preferences: ${userPreferences}`;

  return callAI(systemPrompt, documentText);
}

/**
 * Generates creative story angles for a video
 */
export async function generateStories(documentText: string, userPreferences: string = ""): Promise<AIResponse> {
  const systemPrompt = `You are a creative storyteller. 
  Generate 3 to 5 unique story angles or narrative approaches for a short video based on the document text. 
  The output must be a JSON object with a 'stories' array. Each story should have 'title', 'narrativeAngle', 'targetAudience', and 'recommendedTone'.
  Base your stories strictly on the provided content.
  User Preferences: ${userPreferences}`;

  return callAI(systemPrompt, documentText);
}

/**
 * Generates a full video script
 */
export async function generateScript(documentText: string, storyContext: string = ""): Promise<AIResponse> {
  const systemPrompt = `You are a professional scriptwriter. 
  Create a video script based on the provided content and the selected narrative story approach. 
  The output must be a JSON object with 'videoTitle', 'hook', and 'scenes' (array). 
  Each scene MUST be a fully populated object with 'sceneNumber', 'narration' (the spoken text), 'textOnScreen', and 'cta'.
  IMPORTANT: Do not include empty scenes, blank objects, or null values in the 'scenes' array. Every item must have actual content.
  Base your script strictly on the provided content.
  Selected Story Context: ${storyContext}`;

  return callAI(systemPrompt, documentText);
}

/**
 * Generates a storyboard with visual descriptions
 */
export async function generateStoryboard(scriptContext: string): Promise<AIResponse> {
  const systemPrompt = `You are a visual director. 
  Create a storyboard for a video based on the provided script. 
  The output must be a JSON object with 'scenes' (array). 
  Each scene MUST be a fully populated object with 'sceneNumber', 'duration' (estimated time in seconds as string, e.g., '5s'), 'narration' (from the script), 'visualSuggestion' (detailed for AI image generation), 'cameraType' (e.g. wide shot, close up), and 'transition'.
  IMPORTANT: Do not include empty scenes, blank objects, or null values in the 'scenes' array. Every item must have actual content.
  Base your storyboard strictly on the provided script.`;

  return callAI(systemPrompt, scriptContext);
}
