import { AppError } from '../../utils/errors.js';
import { findPair } from '../../utils/languages.js';
import { env } from '../../config/env.js';
import { translateWithFallback, reviewWithFallback, generateTestsWithFallback } from '../ai/index.js';
import { runVerification } from '../verification/VerificationService.js';
import { demoMigration } from '../translation/demo.js';
import { requiresInput } from '../../utils/inputDependency.js';
import { preserveCobolNumericFormatting } from '../../utils/cobolOutput.js';

function sanitizeGeneratedTests(tests, sourceCode, targetLanguage) {
  const list = Array.isArray(tests) ? tests : [];
  const targetUsesWideIntegers = /long\s+long|long\s+int|int64_t|long\b|BigInteger|BigInt/i.test(sourceCode) && /C\+\+|C|Java|PHP/i.test(targetLanguage);
  if (targetUsesWideIntegers) return list;
  return list.filter((test) => {
    const input = String(test?.input ?? '').trim();
    if (!input || !/^[+-]?\d+(?:\s+[+-]?\d+)*$/.test(input)) return true;
    return input.split(/\s+/).every((token) => {
      const n = Number(token);
      return !Number.isFinite(n) || Math.abs(n) <= 2147483647;
    });
  });
}

export async function runTranslationPipeline({ sourceLanguage, targetLanguage, sourceCode, userId, userTests = [] }) {
  if (!findPair(sourceLanguage, targetLanguage)) throw new AppError('Unsupported language pair.', 422, 'UNSUPPORTED_PAIR');
  if (!sourceCode?.trim()) throw new AppError('Source code cannot be empty.', 422, 'EMPTY_CODE');
  if (sourceCode.length > env.maxCodeSize) throw new AppError(`Code exceeds the ${env.maxCodeSize}-character limit.`, 413, 'CODE_TOO_LARGE');

  if (env.demoMode && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) return demoMigration({ sourceLanguage, targetLanguage, sourceCode });

  const translated = await translateWithFallback({ sourceLanguage, targetLanguage, sourceCode });
  if (sourceLanguage === 'COBOL' && targetLanguage === 'Java') {
    // COBOL DISPLAY advances to the next line by default. Prefer println so the
    // translated Java preserves the observable console behavior.
    translated.code = translated.code.replace(/\bSystem\.out\.print\(/g, 'System.out.println(');
  }
  if (sourceLanguage === 'COBOL') {
    translated.code = preserveCobolNumericFormatting(sourceCode, translated.code, targetLanguage);
  }
  const aiReview = await reviewWithFallback({ sourceLanguage, targetLanguage, sourceCode, generatedCode: translated.code });
  const generated = await generateTestsWithFallback({ sourceLanguage, targetLanguage, sourceCode });
  const inputDependent = requiresInput(sourceLanguage, sourceCode);
  const safeGenerated = sanitizeGeneratedTests(generated, sourceCode, targetLanguage);
  const baseTests = inputDependent
    ? [...userTests, ...safeGenerated]
    : [...userTests.filter((t) => !(t.input ?? '').trim()), { name: 'TC_01', input: '', expectedOutput: '' }];
  const tests = baseTests.slice(0, 12).map((t, i) => ({ name:t.name || `TC_${String(i+1).padStart(2,'0')}`, input:t.input ?? '', expectedOutput:t.expectedOutput ?? '' }));
  const verification = await runVerification({ sourceLanguage, targetLanguage, sourceCode, generatedCode: translated.code, tests });
  const behavioralScore = verification.executionUnavailable ? null : verification.totalTests ? Math.round((verification.passedTests / verification.totalTests) * 100) : null;
  const status = verification.executionUnavailable ? 'EXECUTION UNAVAILABLE' : verification.compilationErrors > 0 ? 'COMPILATION ERROR' : verification.runtimeErrors > 0 && verification.passedTests === 0 ? 'RUNTIME ERROR' : behavioralScore === null ? 'AI REVIEW REQUIRED' : behavioralScore >= 90 ? 'VERIFIED' : behavioralScore >= 50 ? 'PARTIALLY VERIFIED' : 'FAILED';
  return { sourceLanguage, targetLanguage, sourceCode, generatedCode:translated.code, aiProvider:translated.provider, aiModel:translated.model, aiReview, verification:{...verification, score:behavioralScore, status}, userId, demo:false };
}
