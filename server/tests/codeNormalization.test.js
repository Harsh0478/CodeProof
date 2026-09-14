import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanGeneratedCode } from '../src/utils/codeNormalization.js';

test('decodes double-escaped generated source code', () => {
  const input = String.raw`public class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}`;
  const output = cleanGeneratedCode(input);
  assert.match(output, /public class Hello \{/);
  assert.match(output, /\n    public static void main/);
  assert.doesNotMatch(output, /\\n/);
});

test('keeps normal source-code escapes intact when real newlines exist', () => {
  const input = String.raw`public class Hello {
    public static void main(String[] args) {
        System.out.println("a\nb");
    }
}`;
  const output = cleanGeneratedCode(input);
  assert.match(output, /a\\nb/);
});
