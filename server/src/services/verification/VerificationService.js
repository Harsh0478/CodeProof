import { ExecutionService } from '../execution/ExecutionService.js';

function normalizeOutput(value = '') {
  return String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n');
}

function repeatedResult(test, status, error, executionTime = 0, originalOutput = '', actualOutput = '') {
  const sourceOutput = normalizeOutput(originalOutput);
  const targetOutput = normalizeOutput(actualOutput);
  return {
    ...test,
    expectedOutput: sourceOutput,
    originalOutput: sourceOutput,
    actualOutput: targetOutput,
    translatedOutput: targetOutput,
    status,
    error,
    executionTime
  };
}

export async function runVerification({ sourceLanguage, targetLanguage, sourceCode, generatedCode, tests }, executor = ExecutionService) {
  const started = Date.now();
  const safeTests = (Array.isArray(tests) ? tests : []).slice(0, 12).map((test, index) => ({
    ...test,
    name: `TC_${String(index + 1).padStart(2, '0')}`,
    input: test?.input ?? ''
  }));
  const inputs = safeTests.map((test) => test.input);

  if (!safeTests.length) {
    return { results: [], totalTests: 0, passedTests: 0, failedTests: 0, compilationErrors: 0, runtimeErrors: 0, executionUnavailable: false, executionTime: Date.now() - started };
  }

  const [originalRuns, targetRuns] = await Promise.all([
    executor.executeBatch(sourceLanguage, sourceCode, inputs),
    executor.executeBatch(targetLanguage, generatedCode, inputs)
  ]);

  const sourceResults = Array.isArray(originalRuns) ? originalRuns : [];
  const targetResults = Array.isArray(targetRuns) ? targetRuns : [];

  let compilationErrors = 0;
  let runtimeErrors = 0;
  const executionUnavailable = sourceResults.some((r) => r?.status === 'UNAVAILABLE') || targetResults.some((r) => r?.status === 'UNAVAILABLE');
  if (sourceResults[0]?.status === 'COMPILATION_ERROR') compilationErrors += 1;
  if (targetResults[0]?.status === 'COMPILATION_ERROR') compilationErrors += 1;

  const results = safeTests.map((test, index) => {
    const original = sourceResults[index] || { status: 'UNAVAILABLE', stdout: '', stderr: 'Source execution did not return a result.', executionTime: 0 };
    const target = targetResults[index] || { status: 'UNAVAILABLE', stdout: '', stderr: 'Target execution did not return a result.', executionTime: 0 };
    const sourceOutput = normalizeOutput(original.stdout || '');
    const targetOutput = normalizeOutput(target.stdout || '');
    const executionTime = (original.executionTime || 0) + (target.executionTime || 0);

    if (original.status === 'UNAVAILABLE' || target.status === 'UNAVAILABLE') {
      return repeatedResult(test, 'UNAVAILABLE', original.status === 'UNAVAILABLE' ? original.stderr : target.stderr, executionTime, sourceOutput, targetOutput);
    }
    if (original.status === 'COMPILATION_ERROR' || target.status === 'COMPILATION_ERROR') {
      return repeatedResult(test, 'COMPILATION_ERROR', original.status === 'COMPILATION_ERROR' ? original.stderr : target.stderr, executionTime, sourceOutput, targetOutput);
    }
    if (original.status === 'RUNTIME_ERROR' || target.status === 'RUNTIME_ERROR') {
      runtimeErrors += 1;
      return repeatedResult(test, 'RUNTIME_ERROR', original.status === 'RUNTIME_ERROR' ? original.stderr : target.stderr, executionTime, sourceOutput, targetOutput);
    }

    const pass = sourceOutput === targetOutput;
    return {
      ...test,
      expectedOutput: sourceOutput,
      originalOutput: sourceOutput,
      actualOutput: targetOutput,
      translatedOutput: targetOutput,
      status: pass ? 'PASS' : 'FAIL',
      error: pass ? null : 'Translated output differs from original behavior.',
      executionTime
    };
  });

  const comparable = results.filter((result) => result.status === 'PASS' || result.status === 'FAIL');
  const passedTests = comparable.filter((result) => result.status === 'PASS').length;
  const failedTests = results.filter((result) => ['FAIL', 'COMPILATION_ERROR', 'RUNTIME_ERROR'].includes(result.status)).length;

  return {
    results,
    totalTests: results.length,
    passedTests,
    failedTests,
    compilationErrors,
    runtimeErrors,
    executionUnavailable,
    executionTime: Date.now() - started
  };
}
