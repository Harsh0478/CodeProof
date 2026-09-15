const RULES = [
  { language: 'COBOL', patterns: [/IDENTIFICATION\s+DIVISION/i, /PROCEDURE\s+DIVISION/i, /WORKING-STORAGE\s+SECTION/i, /PIC(?:TURE)?\s+/i, /\bPERFORM\b/i, /\bDISPLAY\b/i], weights: [0.55,0.5,0.3,0.3,0.2,0.18] },
  { language: 'PHP', patterns: [/<\?php/i, /\$[A-Za-z_][A-Za-z0-9_]*/, /\becho\b/i, /\bfunction\s+[A-Za-z_]/i, /->/], weights: [0.75,0.25,0.2,0.18,0.12] },
  { language: 'PL/SQL', patterns: [/\bDBMS_OUTPUT\s*\./i, /\bDECLARE\b/i, /\bBEGIN\b[\s\S]*\bEND\s*;/i, /\bEXCEPTION\b/i, /\bCREATE\s+(OR\s+REPLACE\s+)?(PROCEDURE|FUNCTION|TRIGGER)\b/i, /(^|\n)\s*\/\s*($|\n)/], weights: [0.55,0.3,0.35,0.2,0.45,0.22] },
  { language: 'C++', patterns: [/#include\s*<iostream>/i, /\bstd::/i, /\busing\s+namespace\s+std\s*;/i, /\bcout\s*<</i, /\bcin\s*>>/i, /#include\s*<vector>/i, /\bclass\s+[A-Za-z_]/i], weights: [0.5,0.4,0.35,0.3,0.3,0.22,0.18] },
  { language: 'C', patterns: [/#include\s*<stdio\.h>/i, /#include\s*<stdlib\.h>/i, /\bprintf\s*\(/i, /\bscanf\s*\(/i, /\bmalloc\s*\(/i, /\bstruct\s+[A-Za-z_]/i], weights: [0.5,0.4,0.28,0.28,0.2,0.18] },
  { language: 'Java', patterns: [/\bpublic\s+(?:final\s+)?class\s+[A-Za-z_]/i, /\bSystem\s*\.\s*out\s*\./i, /\bimport\s+java\./i, /\bpublic\s+static\s+void\s+main\s*\(/i, /\bnew\s+[A-Z][A-Za-z0-9_]*\s*\(/], weights: [0.48,0.4,0.38,0.35,0.15] },
  { language: 'Python', patterns: [
    /^\s*def\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/m,
    /^\s*(?:from\s+[A-Za-z_][\w.]*\s+import|import\s+[A-Za-z_])/m,
    /\bprint\s*\(/i,
    /\binput\s*\(/i,
    /\bif\s+__name__\s*==\s*["']__main__["']/i,
    /:\s*(?:#.*)?$/m,
    /\b(?:elif|except|lambda|yield)\b/i,
    /\b(?:True|False|None)\b/,
    /\bfor\s+[A-Za-z_][A-Za-z0-9_]*\s+in\b/i,
    /\b(?:range|len|map|enumerate|str|int|float)\s*\(/i,
  ], weights: [0.42,0.3,0.24,0.32,0.5,0.12,0.16,0.08,0.22,0.12] }
];

export function detectSourceLanguage(code = '') {
  const text = String(code || '');
  if (!text.trim()) return { language: null, confidence: 0, scores: {} };

  const scores = {};
  for (const rule of RULES) {
    let score = 0;
    rule.patterns.forEach((pattern, index) => {
      if (pattern.test(text)) score += rule.weights[index] || 0.1;
    });
    scores[rule.language] = Math.min(score, 1);
  }

  if (/#include\s*<iostream>/i.test(text)) scores['C++'] = Math.max(scores['C++'], 0.82);
  if (/<\?php/i.test(text)) scores.PHP = Math.max(scores.PHP, 0.9);
  if (/IDENTIFICATION\s+DIVISION/i.test(text)) scores.COBOL = Math.max(scores.COBOL, 0.95);
  if (/\bDBMS_OUTPUT\s*\./i.test(text)) scores['PL/SQL'] = Math.max(scores['PL/SQL'], 0.85);

  // Strong Python combinations: input/print, def/import, or Python-only literals.
  const pythonSignals = [
    /\binput\s*\(/i,
    /\bprint\s*\(/i,
    /^\s*def\s+\w+\s*\(/m,
    /^\s*(?:from\s+\w[\w.]*\s+import|import\s+\w+)/m,
    /\b(?:True|False|None)\b/,
  ].filter((pattern) => pattern.test(text)).length;
  if (pythonSignals >= 2) scores.Python = Math.max(scores.Python, Math.min(0.55 + pythonSignals * 0.1, 0.95));
  const looksLikePythonPrint = /\bprint\s*\(/i.test(text) && !/\b(?:printf|cout|System\s*\.\s*out|echo)\s*\(?/i.test(text);
  if (looksLikePythonPrint) scores.Python = Math.max(scores.Python, 0.45);

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [language, raw] = ranked[0] || [null, 0];
  const second = ranked[1]?.[1] || 0;
  const confidence = Math.round(raw * 100) / 100;
  const reliable = confidence >= 0.3 && confidence - second >= 0.06;

  return { language: reliable ? language : null, confidence: reliable ? confidence : 0, scores };
}
