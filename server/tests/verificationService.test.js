import test from 'node:test';
import assert from 'node:assert/strict';
import { runVerification } from '../src/services/verification/VerificationService.js';

test('uses source stdout as the expected behavioral output and keeps test count aligned', async () => {
  const executor = {
    executeBatch: async (_lang, _code, inputs) => inputs.map((_, i) => ({ status: 'PASS', stdout: i === 0 ? '3\n' : '0\n', stderr: '', executionTime: 4 }))
  };
  const result = await runVerification({
    sourceLanguage: 'C', targetLanguage: 'Java', sourceCode: 'source', generatedCode: 'target',
    tests: [{ name: 'x', input: '1 2' }, { name: 'y', input: '0 0' }]
  }, executor);

  assert.equal(result.totalTests, 2);
  assert.equal(result.results.length, 2);
  assert.equal(result.passedTests, 2);
  assert.equal(result.results[0].expectedOutput, '3');
  assert.equal(result.results[0].actualOutput, '3');
  assert.equal(result.results[0].name, 'TC_01');
  assert.equal(result.results[1].name, 'TC_02');
});

test('sandbox unavailable is not converted into FAIL or RUNTIME_ERROR', async () => {
  const executor = { executeBatch: async () => [{ status: 'UNAVAILABLE', stdout: '', stderr: 'Docker unavailable', executionTime: 1 }] };
  const result = await runVerification({ sourceLanguage: 'C', targetLanguage: 'Java', sourceCode: 'source', generatedCode: 'target', tests: [{ input: '1 2' }] }, executor);
  assert.equal(result.executionUnavailable, true);
  assert.equal(result.passedTests, 0);
  assert.equal(result.failedTests, 0);
  assert.equal(result.runtimeErrors, 0);
  assert.equal(result.totalTests, 1);
  assert.equal(result.results[0].status, 'UNAVAILABLE');
});
