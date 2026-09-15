function parseFields(sourceCode = '') {
  const fields = new Map();
  const re = /^\s*\d+\s+([A-Z][A-Z0-9-]*)\s+PIC\s+9\((\d+)\)(?:\s+VALUE\s+([+-]?\d+))?/gim;
  let match;
  while ((match = re.exec(sourceCode)) !== null) {
    fields.set(match[1], { width: Number(match[2]), value: match[3] ?? null });
  }
  return fields;
}

function hasDisplayField(sourceCode, field) {
  return new RegExp(`\\bDISPLAY\\b[^\\n]*\\b${field}\\b`, 'i').test(sourceCode);
}

export function preserveCobolNumericFormatting(sourceCode = '', generatedCode = '', targetLanguage = '') {
  if (!sourceCode || !generatedCode || !/IDENTIFICATION DIVISION|PROCEDURE DIVISION|\bPIC\s+9\(/i.test(sourceCode)) return generatedCode;
  let code = String(generatedCode);

  for (const [field, info] of parseFields(sourceCode)) {
    if (!info.width || !hasDisplayField(sourceCode, field)) continue;
    const width = info.width;

    if (targetLanguage === 'C') {
      const re = new RegExp(`printf\\(("[^"\\n]*?)%d([^"\\n]*"\\s*,\\s*)${field}\\s*\\)`, 'g');
      code = code.replace(re, (_m, before, middle) => `printf(${before}%0${width}d${middle}${field})`);
    } else if (targetLanguage === 'C++') {
      // Preserve COBOL fixed-width output for the common cout pattern without
      // forcing formatting changes elsewhere in generated C++.
      if (/std::cout\s*<</.test(code) && new RegExp(`\\b${field}\\b`).test(code) && !/iomanip/.test(code)) {
        code = code.replace(/#include\s*<iostream>\s*/, (m) => `${m}#include <iomanip>\n`);
      }
      const re = new RegExp(`(std::cout[^;]*<<\\s*)(?:${field})`, 'g');
      code = code.replace(re, (_m, prefix) => `${prefix}std::setw(${width}) << std::setfill('0') << ${field}`);
    } else if (targetLanguage === 'Java') {
      const re = new RegExp(`(System\\.out\\.(?:print|println)\\([^\\n]*?"[^"\\n]*"\\s*\\+\\s*)${field}([);])`, 'g');
      code = code.replace(re, (_m, prefix, suffix) => `${prefix}String.format("%0${width}d", ${field})${suffix}`);
    } else if (targetLanguage === 'Python') {
      const fRe = new RegExp(`\\{\\s*${field}\\s*\\}`, 'g');
      code = code.replace(fRe, `{${field}:0${width}d}`);
      const strRe = new RegExp(`str\\(\\s*${field}\\s*\\)`, 'g');
      code = code.replace(strRe, `f"{${field}:0${width}d}"`);
    } else if (targetLanguage === 'PHP') {
      const echoRe = new RegExp(`echo\\s+"([^"]*)\\$${field}([^"]*)"`, 'g');
      code = code.replace(echoRe, (_m, before, after) => `echo "${before}" . str_pad((string)$${field}, ${width}, "0", STR_PAD_LEFT) . "${after}"`);
    }
  }
  return code;
}
