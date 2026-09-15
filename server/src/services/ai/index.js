import { GroqService } from './GroqService.js';
import { GeminiService } from './GeminiService.js';
import { env } from '../../config/env.js';
import { translationPrompt, reviewPrompt, testPrompt } from '../../prompts/translation.js';
import { translationSchema, reviewSchema, testsSchema } from '../../prompts/schemas.js';

export async function translateWithFallback(input) {
  try { const r = await GroqService.translate(translationPrompt(input), translationSchema); return { code:r.code, provider:'groq', model:env.groqModel }; }
  catch (groqError) {
    if (!env.geminiKey) throw groqError;
    const r = await GeminiService.translate(translationPrompt(input)); return { code:r.code, provider:'gemini', model:env.geminiModel, fallbackFrom:groqError.code };
  }
}

export async function reviewWithFallback(input) {
  try { return { ...(await GeminiService.review(reviewPrompt(input))), provider:'gemini', model:env.geminiModel }; }
  catch (e) {
    if (!env.groqKey) throw e;
    return { ...(await GroqService.review(reviewPrompt(input), reviewSchema)), provider:'groq', model:env.groqModel };
  }
}

export async function generateTestsWithFallback(input) {
  try { return (await GroqService.generateTests(testPrompt(input), testsSchema)).tests; }
  catch {
    if (!env.geminiKey) return [];
    return (await GeminiService.generateTests(testPrompt(input))).tests || [];
  }
}
