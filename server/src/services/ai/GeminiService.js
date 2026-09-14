import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

async function callGemini(prompt, responseMimeType='application/json') {
  if (!env.geminiKey) throw new AppError('Gemini is not configured.', 503, 'GEMINI_NOT_CONFIGURED');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiKey)}`;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ contents:[{role:'user', parts:[{text:prompt}]}], generationConfig:{ temperature:0.1, responseMimeType } }), signal:controller.signal });
    if (!r.ok) throw new AppError(`Gemini request failed (${r.status}).`, r.status === 429 ? 429 : 502, r.status === 429 ? 'GEMINI_RATE_LIMIT' : 'GEMINI_ERROR');
    const data = await r.json(); return data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('') || '';
  } catch (e) { if (e.name === 'AbortError') throw new AppError('Gemini request timed out.', 504, 'GEMINI_TIMEOUT'); throw e; }
  finally { clearTimeout(timer); }
}
const parseJSON = (s) => { try { return JSON.parse(s); } catch { const m=s.match(/\{[\s\S]*\}/); if(m) return JSON.parse(m[0]); throw new AppError('Gemini returned invalid JSON.', 502, 'AI_INVALID_RESPONSE'); } };
export const GeminiService = {
  async review(prompt) { return parseJSON(await callGemini(prompt)); },
  async translate(prompt) { const raw = await callGemini(`${prompt}\nReturn JSON exactly as {"code":"<translated code>"}.`); return parseJSON(raw); },
  async generateTests(prompt) { return parseJSON(await callGemini(prompt)); }
};
