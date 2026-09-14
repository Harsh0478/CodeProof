export function cleanGeneratedCode(value = '') {
  let code = String(value ?? '').trim();
  code = code
    .replace(/^```[a-zA-Z0-9_+.#-]*\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();

  // Some models occasionally double-escape the JSON string stored in the code field.
  // Decode only when there are no real line breaks and multiple literal \\n  // sequences, so legitimate escapes inside source strings are preserved.
  if (!code.includes('\n') && (code.match(/\\n/g) || []).length >= 2) {
    code = code
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"');
  }
  return code;
}
