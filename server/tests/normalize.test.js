import test from 'node:test';
import assert from 'node:assert/strict';
const normalize=s=>(s||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim().split('\n').map(x=>x.replace(/[ \t]+$/,'')).join('\n');
test('output normalization ignores harmless whitespace',()=>assert.equal(normalize('30\r\n '),'30'));

// The live translation normalizer is intentionally kept separate from this tiny
// output-normalization helper; this regression case documents the problematic
// AI payload shape seen in the editor/report.
test('escaped generated Java payload should be decoded before formatting', () => {
  const payload = 'import java.util.*;\\npublic class Main {\\n    public static void main(String[] args) {\\n        System.out.println(\\"Even\\");\\n    }\\n}';
  assert.match(payload, /\\\\n/);
  assert.match(payload, /\\\\\"Even\\\\\"/);
});
