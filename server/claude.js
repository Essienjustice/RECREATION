import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export const CLAUDE_SYSTEM_PROMPT = `You are an expert YouTube scriptwriter specializing in faceless stock footage channels. Write a fully structured YouTube video script.

Format your response as JSON with this structure:
{
  "title": "Compelling YouTube title",
  "description": "SEO YouTube description (150 words)",
  "tags": ["tag1", "tag2", ...10 tags],
  "chapters": [
    { "label": "Intro", "timestamp": "0:00" },
    ...
  ],
  "script": [
    {
      "scene": 1,
      "section": "Hook",
      "narration": "Full narration text for this scene",
      "duration_seconds": 20,
      "visual_direction": "What should be shown on screen",
      "stock_search_query": "3-5 word Pexels/Pixabay search term",
      "b_roll_notes": "Any specific shot type or mood notes",
      "text_overlay": "Optional on-screen text or stat to display"
    }
  ]
}
Return ONLY valid JSON. No markdown. No explanation.`;

export async function generateClaudeScript(settings) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Missing ANTHROPIC_API_KEY on the server."), { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });
  const payload = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(settings)
      }
    ]
  });

  const text = payload.content
    ?.filter((item) => item.type === "text" && item.text)
    .map((item) => item.text)
    .join("\n");

  if (!text) {
    throw new Error("Claude returned an empty response.");
  }

  return parseClaudeJson(text);
}

function buildUserPrompt(settings) {
  const niche = settings.niche === "Custom" ? settings.customNiche || "Custom" : settings.niche;
  return `Create a faceless stock-footage YouTube video script with these inputs:

Video topic: ${settings.topic}
Target duration: ${settings.targetDuration} minutes
Channel niche: ${niche}
Tone: ${settings.tone}
Hook style: ${settings.hookStyle}

Use practical stock footage directions. Keep stock_search_query fields to 3-5 words. Return only the required JSON object.`;
}

function parseClaudeJson(text) {
  const clean = text.trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    throw new Error("Claude returned invalid JSON.");
  }
}
