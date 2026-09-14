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
  return {
    ...test,
    status,
    expectedOutput: normalizeOutput(originalOutput || test.expectedOutput || ''),
    originalOutput: normalizeOutput(originalOutput),
    actualOutput: normalizeOutput(actualOutput),
    error,
    executionTime
  };
}

export async function runVerification({ sourceLanguage, targetLanguage, sourceCode, generatedCode, tests }) {
  const started = Date.now();
  const safeTests = Array.isArray(tests) ? tests : [];
  const inputs = safeTests.map((test) => test.input ?? '');
  const results = [];

  // Compile each program once and execute its tests sequentially. Sequential execution
  // avoids CPU contention inside the sandbox and keeps stdout/error association stable.
  const originalRuns = await ExecutionService.executeBatch(sourceLanguage, sourceCode, inputs);
  const targetRuns = await ExecutionService.executeBatch(targetLanguage, generatedCode, inputs);

  let compilationErrors = 0;
  let runtimeErrors = 0;
  let executionUnavailable = false;

  const originalCompilationFailure = originalRuns[0]?.status === 'COMPILATION_ERROR';
  const targetCompilationFailure = targetRuns[0]?.status === 'COMPILATION_ERROR';
  const originalUnavailable = originalRuns[0]?.status === 'UNAVAILABLE';
  const targetUnavailable = targetRuns[0]?.status === 'UNAVAILABLE';

  if (originalCompilationFailure) compilationErrors += 1;
  if (targetCompilationFailure) compilationErrors += 1;
  if (originalUnavailable || targetUnavailable) executionUnavailable = true;

  for (let i = 0; i < safeTests.length; i += 1) {
    const test = safeTests[i];
    const original = originalRuns[i];
    const target = targetRuns[i];

    if (original.status === 'UNAVAILABLE' || target.status === 'UNAVAILABLE') {
      results.push(repeatedResult(
        test,
        'UNAVAILABLE',
        original.status === 'UNAVAILABLE' ? original.stderr : target.stderr,
        (original.executionTime || 0) + (target.executionTime || 0),
        original.stdout,
        target.stdout
      ));
      continue;
    }

    if (original.status === 'COMPILATION_ERROR' || target.status === 'COMPILATION_ERROR') {
      results.push(repeatedResult(
        test,
        'COMPILATION_ERROR',
        original.status === 'COMPILATION_ERROR' ? original.stderr : target.stderr,
        (original.executionTime || 0) + (target.executionTime || 0),
        original.stdout,
        target.stdout
      ));
      continue;
    }

    if (original.status === 'RUNTIME_ERROR' || target.status === 'RUNTIME_ERROR') {
      runtimeErrors += 1;
      results.push(repeatedResult(
        test,
        'RUNTIME_ERROR',
        original.status === 'RUNTIME_ERROR' ? original.stderr : target.stderr,
        (original.executionTime || 0) + (target.executionTime || 0),
        original.stdout,
        target.stdout
      ));
      continue;
    }

    const expected = normalizeOutput(original.stdout);
    const actual = normalizeOutput(target.stdout);
    const pass = expected === actual;

    results.push({
      ...test,
      expectedOutput: expected,
      originalOutput: expected,
      actualOutput: actual,
      status: pass ? 'PASS' : 'FAIL',
      error: pass ? null : 'Translated output differs from original behavior.',
      executionTime: (original.executionTime || 0) + (target.executionTime || 0)
    });
  }

  const comparable = results.filter((result) => result.status === 'PASS' || result.status === 'FAIL');
  const passedTests = comparable.filter((result) => result.status === 'PASS').length;
  const failedTests = results.filter((result) => result.status === 'FAIL' || result.status === 'UNAVAILABLE').length;
  const totalTests = safeTests.length;

  return {
    results,
    totalTests,
    passedTests,
    failedTests,
    compilationErrors,
    runtimeErrors,
    executionUnavailable,
    executionTime: Date.now() - started
  };
}
