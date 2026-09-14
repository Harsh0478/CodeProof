import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

async function callGroq(messages, responseSchema) {
  if (!env.groqKey) throw new AppError('Groq is not configured.', 503, 'GROQ_NOT_CONFIGURED');
  const body = { model: env.groqModel, messages, temperature: 0.1, max_tokens: 12000 };
  if (responseSchema) body.response_format = { type: 'json_schema', json_schema: { name: 'codeproof_response', strict: true, schema: responseSchema } };
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${env.groqKey}` }, body: JSON.stringify(body), signal: controller.signal });
    const text = await r.text();
    if (!r.ok) throw new AppError(`Groq request failed (${r.status}).`, r.status === 429 ? 429 : 502, r.status === 429 ? 'GROQ_RATE_LIMIT' : 'GROQ_ERROR');
    const data = JSON.parse(text); return data.choices?.[0]?.message?.content ?? '';
  } catch (e) { if (e.name === 'AbortError') throw new AppError('Groq request timed out.', 504, 'GROQ_TIMEOUT'); throw e; }
  finally { clearTimeout(timer); }
}

const parseJSON = (s) => { try { return JSON.parse(s); } catch { const match = s.match(/\{[\s\S]*\}/); if (match) return JSON.parse(match[0]); throw new AppError('Groq returned invalid structured data.', 502, 'AI_INVALID_RESPONSE'); } };

export const GroqService = {
  async translate(prompt, schema) { return parseJSON(await callGroq([{ role:'system', content:'Return only the requested structured JSON.' }, { role:'user', content:prompt }], schema)); },
  async review(prompt, schema) { return parseJSON(await callGroq([{ role:'system', content:'You are a rigorous code verification reviewer. Return only JSON.' }, { role:'user', content:prompt }], schema)); },
  async generateTests(prompt, schema) { return parseJSON(await callGroq([{ role:'system', content:'Return only JSON test cases.' }, { role:'user', content:prompt }], schema)); }
};
