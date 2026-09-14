import test from 'node:test';
import assert from 'node:assert/strict';
import { findPair, supportedTargets } from '../src/utils/languages.js';
test('supported pairs are enforced',()=>{assert.ok(findPair('C','Java'));assert.equal(findPair('C','Ruby'),undefined);});
test('target configuration is dynamic',()=>{assert.deepEqual(supportedTargets('PL/SQL'),['C','C++','Java','Python','PHP','COBOL']);});
