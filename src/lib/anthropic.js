import { apiJson } from "./apiClient.js";

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
  return apiJson("/api/script", {
    method: "POST",
    body: JSON.stringify({ settings })
  });
}
