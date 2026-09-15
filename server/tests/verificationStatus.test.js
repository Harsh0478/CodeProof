import test from 'node:test';
import assert from 'node:assert/strict';

test('unavailable tests are not counted as failed tests', () => {
  const results = [
    { status: 'UNAVAILABLE' },
    { status: 'UNAVAILABLE' },
    { status: 'PASS' }
  ];
  const failedTests = results.filter(r => ['FAIL', 'COMPILATION_ERROR', 'RUNTIME_ERROR'].includes(r.status)).length;
  assert.equal(failedTests, 0);
});
