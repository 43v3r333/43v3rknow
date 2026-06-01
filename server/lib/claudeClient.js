import Anthropic from '@anthropic-ai/sdk';

// Replit AI Integrations provides the API key automatically via environment.
// Do NOT pass an apiKey here — Replit injects it.
const client = new Anthropic();

export async function streamClaudeResponse({ systemPrompt, userMessage, maxTokens = 4096 }) {
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return stream;
}

export function parseJsonResponse(text) {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return JSON.parse(cleaned.trim());
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return null;
  }
}