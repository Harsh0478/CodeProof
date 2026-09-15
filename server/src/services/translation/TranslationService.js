import { AppError } from '../../utils/errors.js';
import { findPair } from '../../utils/languages.js';
import { env } from '../../config/env.js';
import { translateWithFallback, reviewWithFallback, generateTestsWithFallback } from '../ai/index.js';
import { runVerification } from '../verification/VerificationService.js';
import { demoMigration } from '../translation/demo.js';
import { requiresInput } from '../../utils/inputDependency.js';


function normalizeGeneratedCode(code = '', language = '') {
  let value = String(code).replace(/^\s*```(?:[\w#+.-]+)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  // Some providers return the entire program as a partially escaped string, e.g.
  // `\npublic class Main ... System.out.println(\"Even\");`.  That representation
  // may already contain real line breaks too, so checking the number of real lines
  // is not sufficient.  Detect the escaped-code signature and decode one layer.
  const escapedNewlines = (value.match(/\\n/g) || []).length;
  const escapedQuotes = (value.match(/\\"/g) || []).length;
  const escapedTabs = (value.match(/\\t/g) || []).length;
  const looksLikeEscapedProgram = escapedNewlines > 0 && (escapedQuotes > 0 || escapedTabs > 0);

  if (looksLikeEscapedProgram) {
    value = value
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"');
  }

  return value.trim();
}

export async function runTranslationPipeline({ sourceLanguage, targetLanguage, sourceCode, userId, userTests = [] }) {
  if (!findPair(sourceLanguage, targetLanguage)) throw new AppError('Unsupported language pair.', 422, 'UNSUPPORTED_PAIR');
  if (!sourceCode?.trim()) throw new AppError('Source code cannot be empty.', 422, 'EMPTY_CODE');
  if (sourceCode.length > env.maxCodeSize) throw new AppError(`Code exceeds the ${env.maxCodeSize}-character limit.`, 413, 'CODE_TOO_LARGE');

  if (env.demoMode && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) return demoMigration({ sourceLanguage, targetLanguage, sourceCode });

  const translated = await translateWithFallback({ sourceLanguage, targetLanguage, sourceCode });
  translated.code = normalizeGeneratedCode(translated.code, targetLanguage);
  const aiReview = await reviewWithFallback({ sourceLanguage, targetLanguage, sourceCode, generatedCode: translated.code });
  const generated = await generateTestsWithFallback({ sourceLanguage, targetLanguage, sourceCode });
  const inputDependent = requiresInput(sourceLanguage, sourceCode);
  const baseTests = inputDependent
    ? [...userTests, ...generated]
    : [...userTests.filter((t) => !(t.input ?? '').trim()), { name: 'TC_01', input: '', expectedOutput: '' }];
  const tests = baseTests.slice(0, 12).map((t, i) => ({ name:t.name || `TC_${String(i+1).padStart(2,'0')}`, input:t.input ?? '', expectedOutput:t.expectedOutput ?? '' }));
  const verification = await runVerification({ sourceLanguage, targetLanguage, sourceCode, generatedCode: translated.code, tests });
  const behavioralScore = verification.totalTests ? Math.round((verification.passedTests / verification.totalTests) * 100) : null;
  const status = verification.executionUnavailable ? 'EXECUTION UNAVAILABLE' : verification.compilationErrors > 0 ? 'COMPILATION ERROR' : verification.runtimeErrors > 0 && verification.passedTests === 0 ? 'RUNTIME ERROR' : behavioralScore === null ? 'AI REVIEW REQUIRED' : behavioralScore >= 90 ? 'VERIFIED' : behavioralScore >= 50 ? 'PARTIALLY VERIFIED' : 'FAILED';
  return { sourceLanguage, targetLanguage, sourceCode, generatedCode:translated.code, aiProvider:translated.provider, aiModel:translated.model, aiReview, verification:{...verification, score:behavioralScore, status}, userId, demo:false };
}
