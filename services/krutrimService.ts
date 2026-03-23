/// <reference types="vite/client" />
// --- Groq API Service ---
// Uses OpenAI-compatible REST API at api.groq.com (free tier available)
// Get your free API key at: https://console.groq.com/keys

const GROQ_BASE_URL = '/api/groq/openai/v1';
const MODEL = 'llama-3.3-70b-versatile';

const getApiKey = (): string => {
  // Check Vite environment variables first (most secure for local dev)
  if (import.meta.env.VITE_GROQ_API_KEY) {
    return import.meta.env.VITE_GROQ_API_KEY;
  }
  // Fallback to window.APP_CONFIG.GROQ_API_KEY (from config.js)
  // @ts-ignore
  if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.GROQ_API_KEY && window.APP_CONFIG.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE') {
    // @ts-ignore
    return window.APP_CONFIG.GROQ_API_KEY;
  }
  throw new Error(
    "API key not found. Please add VITE_GROQ_API_KEY to your .env file or APP_CONFIG.GROQ_API_KEY to config.js. Get a free key at https://console.groq.com/keys"
  );
};

export interface StreamChunk {
  text: string;
}

/**
 * Generates text using the Groq API with streaming (SSE).
 * The AI auto-detects the user's language and responds in kind.
 */
export async function* generateTextStream(prompt: string): AsyncGenerator<StreamChunk> {
  const apiKey = getApiKey();

  const systemPrompt = `You are a helpful multilingual AI assistant.
IMPORTANT: Detect the language and script of the user's message automatically.
Always respond in the EXACT SAME language and script as the user's message.
- If the user writes in Telugu (తెలుగు), respond entirely in Telugu script.
- If the user writes in Hindi (हिन्दी), respond entirely in Devanagari script.
- If the user writes in Tamil (தமிழ்), respond entirely in Tamil script.
- If the user writes in any other language, match it exactly.
- If the user writes in English, respond in English.
Never mix languages or switch to English unless the user does first.`;

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Groq API error:', response.status, errorBody);
    throw new Error(`Groq API error (${response.status}): ${errorBody || response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to get response stream reader.');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') { if (trimmed === 'data: [DONE]') return; continue; }
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield { text: content };
        } catch { continue; }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
