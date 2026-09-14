import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresInput } from '../src/utils/inputDependency.js';

test('detects stdin-dependent C programs', () => {
  assert.equal(requiresInput('C', 'int x; scanf("%d", &x);'), true);
});

test('detects input-dependent Java programs', () => {
  assert.equal(requiresInput('Java', 'Scanner sc = new Scanner(System.in); int x = sc.nextInt();'), true);
});

test('recognizes no-input COBOL program', () => {
  assert.equal(requiresInput('COBOL', 'DISPLAY "Hello".'), false);
});
