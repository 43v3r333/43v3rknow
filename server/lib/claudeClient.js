// NVIDIA NIM API integration
// Uses NVIDIA's free tier API - set NVIDIA_API_KEY environment variable

const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';

export async function streamClaudeResponse({ systemPrompt, userMessage, maxTokens = 4096 }) {
  const apiKey = process.env.NVIDIA_API_KEY;
  
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY environment variable is not set. Get your free key at https://ngc.nvidia.com/');
  }

  // Use llama-3.1-70b which is available on NVIDIA NIM
  const model = 'meta/llama-3.1-70b-instruct';
  
  // Create a mock stream that wraps the fetch call
  const stream = {
    [Symbol.asyncIterator]: async function* () {
      const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: maxTokens,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const json = JSON.parse(data);
              if (json.choices?.[0]?.delta?.content) {
                yield { type: 'content_block_delta', delta: { text: json.choices[0].delta.content } };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }
  };

  return stream;
}

export function parseJsonResponse(text) {
  try {
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