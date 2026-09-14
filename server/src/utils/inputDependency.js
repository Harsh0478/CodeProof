const patterns = {
  C: [/\bscanf\s*\(/, /\bfscanf\s*\(/, /\bgetchar\s*\(/, /\bfgets\s*\(/, /\bgets\s*\(/],
  'C++': [/\bstd::cin\b/, /\bcin\s*>>/, /\bgetline\s*\(/, /\bscanf\s*\(/],
  Java: [/\bScanner\b/, /\bSystem\.in\b/, /\bBufferedReader\b/, /\bConsole\b/],
  Python: [/\binput\s*\(/, /\bsys\.stdin\b/, /\bstdin\.read\b/],
  PHP: [/php:\/\/stdin/, /\bSTDIN\b/, /\breadline\s*\(/, /\bfgets\s*\(/],
  COBOL: [/\bACCEPT\b/i],
  'PL/SQL': [/&\w+/, /\bACCEPT\b/i]
};

export function requiresInput(language, sourceCode = '') {
  const list = patterns[language] || [];
  return list.some((pattern) => pattern.test(sourceCode));
}
