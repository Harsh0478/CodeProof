import test from 'node:test';
import assert from 'node:assert/strict';
const normalize=s=>(s||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim().split('\n').map(x=>x.replace(/[ \t]+$/,'')).join('\n');
test('output normalization ignores harmless whitespace',()=>assert.equal(normalize('30\r\n '),'30'));
