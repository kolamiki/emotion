/**
 * eMotion AI Chat Proxy - Cloudflare Worker
 *
 * This lightweight proxy sits between the frontend (GitHub Pages)
 * and the LLM API (Gemini / Groq). It:
 *   1. Keeps API keys secret (stored as Worker Secrets, never sent to browser)
 *   2. Validates and sanitizes requests
 *   3. Handles CORS reliably for GitHub Pages and local development
 *   4. Forwards the conversation to the chosen LLM and returns the reply
 */

export interface Env {
  // Secrets (set via `wrangler secret put`)
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;

  // Variables (set in wrangler.toml)
  AI_PROVIDER: 'gemini' | 'groq';
  AI_MODEL: string;
  ALLOWED_ORIGIN: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface IncomingRequest {
  personalityId: string;
  systemPrompt: string;
  messages: ChatMessage[];
}

// ============================================
//  CORS HEADERS
// ============================================

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };
}

// ============================================
//  ORIGIN VALIDATION (BLOCK UNRELATED WEBSITES)
// ============================================

function isForeignSite(origin: string | null): boolean {
  if (!origin) return false; // Allow direct/same-origin/privacy-stripped requests
  const lower = origin.toLowerCase();

  // Allow GitHub Pages and Localhost
  if (
    lower.endsWith('.github.io') ||
    lower.includes('localhost') ||
    lower.includes('127.0.0.1')
  ) {
    return false;
  }

  // Reject foreign domains trying to leech your worker
  return true;
}

// ============================================
//  GEMINI API
// ============================================

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const modelsToTry = [
    model,
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash-lite',
    'gemini-3.6-flash',
  ].filter((v, i, a) => a.indexOf(v) === i);

  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const allErrors: string[] = [];

  for (const m of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.85,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        allErrors.push(`[${m} status ${response.status}]: ${errorText}`);
        continue;
      }

      const data = await response.json() as any;
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply) {
        return reply;
      }
    } catch (err: any) {
      allErrors.push(`[${m} exception]: ${err?.message || String(err)}`);
    }
  }

  throw new Error(`Gemini API failed. Errors:\n${allErrors.join('\n')}`);
}

// ============================================
//  GROQ API
// ============================================

async function callGroq(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: groqMessages,
      temperature: 0.9,
      max_tokens: 500,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as any;
  const reply = data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error('No reply in Groq response');
  }

  return reply;
}

// ============================================
//  MAIN HANDLER
// ============================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders();

    // 1. Handle CORS preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // 2. Handle GET healthcheck
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          message: 'eMotion AI Proxy is operational',
          provider: env.AI_PROVIDER,
          model: env.AI_MODEL,
        }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Only accept POST for chat
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // 4. Block unrelated third-party websites
    const origin = request.headers.get('Origin');
    if (isForeignSite(origin)) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Foreign origins not allowed.' }),
        { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Parse and validate request
      const body = await request.json() as IncomingRequest;

      if (!body.systemPrompt || !Array.isArray(body.messages) || body.messages.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid request: systemPrompt and messages required' }),
          { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      // Limit message count to prevent abuse
      const trimmedMessages = body.messages.slice(-20);

      let reply: string;

      if (env.AI_PROVIDER === 'groq') {
        if (!env.GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY not configured');
        }
        reply = await callGroq(env.GROQ_API_KEY, env.AI_MODEL, body.systemPrompt, trimmedMessages);
      } else {
        // Default: Gemini
        if (!env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY not configured');
        }
        reply = await callGemini(env.GEMINI_API_KEY, env.AI_MODEL, body.systemPrompt, trimmedMessages);
      }

      return new Response(
        JSON.stringify({ reply, model: env.AI_MODEL }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AI Proxy Error]', message);

      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
  },
};
