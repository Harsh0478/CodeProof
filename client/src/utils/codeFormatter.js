const decodeEscapedCode = (text = '') => {
  let value = String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const actualLines = (value.match(/\n/g) || []).length;
  const escapedNewlines = (value.match(/\\n/g) || []).length;
  if (escapedNewlines >= 1 && actualLines <= 1) {
    value = value
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"');
  }
  return value;
};

const normalizeLines = (text) => text
  .split('\n')
  .map(line => line.replace(/[ \t]+$/g, ''))
  .join('\n')
  .trim();

// Split structural characters while preserving quoted strings and comments.
function splitBracedStatements(text) {
  const lines = [];
  let current = '';
  let quote = null;
  let escape = false;
  let lineComment = false;
  let blockComment = false;

  const flush = () => {
    const value = current.trim();
    if (value) lines.push(value);
    current = '';
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      current += ch;
      if (ch === '\n') {
        lineComment = false;
        flush();
      }
      continue;
    }

    if (blockComment) {
      current += ch;
      if (ch === '*' && next === '/') {
        current += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }

    if (quote) {
      current += ch;
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '/' && next === '/') {
      current += ch + next;
      i += 1;
      lineComment = true;
      continue;
    }
    if (ch === '/' && next === '*') {
      current += ch + next;
      i += 1;
      blockComment = true;
      continue;
    }

    // Keep preprocessor directives intact.
    if (ch === '#' && !current.trim()) {
      const end = text.indexOf('\n', i);
      if (end === -1) {
        lines.push(text.slice(i).trim());
        break;
      }
      lines.push(text.slice(i, end).trim());
      i = end;
      continue;
    }

    if (ch === '{') {
      current = `${current.trim()} {`;
      flush();
      continue;
    }
    if (ch === '}') {
      flush();
      lines.push('}');
      continue;
    }
    if (ch === '\n') {
      flush();
      continue;
    }
    current += ch;
  }

  flush();
  return lines;
}

const formatBracedLanguage = (text) => {
  const structuralLines = splitBracedStatements(normalizeLines(text));
  const out = [];
  let indent = 0;
  let previousWasClosingBrace = false;

  structuralLines.forEach(raw => {
    const line = raw.trim();
    if (!line) return;

    const isClosing = line.startsWith('}');
    const isContinuation = /^(else|catch|finally)\b/.test(line);
    if (isClosing) indent = Math.max(0, indent - 1);
    else if (isContinuation && !previousWasClosingBrace) indent = Math.max(0, indent - 1);

    out.push(`${'    '.repeat(indent)}${line}`);
    if (line.endsWith('{')) indent += 1;
    previousWasClosingBrace = isClosing;
  });

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const formatPython = (text) => {
  const lines = decodeEscapedCode(text).split('\n');
  const result = [];
  let indent = 0;
  const dedentKeywords = /^(elif\b|else\s*:|except\b|finally\s*:)/;
  const blockOpener = /:\s*(#.*)?$/;
  const explicitDedenter = /^(return\b|raise\b|break\b|continue\b|pass\b)/;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (result.length && result[result.length - 1] !== '') result.push('');
      continue;
    }
    if (dedentKeywords.test(trimmed)) indent = Math.max(0, indent - 1);
    result.push(`${'    '.repeat(indent)}${trimmed}`);
    if (blockOpener.test(trimmed) && !trimmed.startsWith('#')) indent += 1;
    if (explicitDedenter.test(trimmed)) indent = Math.max(0, indent - 1);
  }
  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const formatCobol = (text) => {
  const lines = decodeEscapedCode(text).split('\n').map(line => line.trim());
  const out = [];
  let indent = 0;
  for (const line of lines) {
    if (!line) continue;
    if (/^(END-IF|END-PERFORM|END-READ|END-WRITE|END-SEARCH|END-EVALUATE)\b/i.test(line)) {
      indent = Math.max(0, indent - 1);
    }
    if (/^(IDENTIFICATION|ENVIRONMENT|DATA|PROCEDURE)\s+DIVISION/i.test(line)) indent = 0;
    out.push(`${'    '.repeat(indent)}${line}`);
    if (/^(IF|PERFORM\s+.*\s+TIMES|READ|WRITE|SEARCH|EVALUATE)\b/i.test(line) && !/^.*\bEND-\w+\b/i.test(line)) indent += 1;
  }
  return out.join('\n').trim();
};

const formatPlsql = (text) => {
  const lines = decodeEscapedCode(text).split('\n');
  const out = [];
  let indent = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(END|ELSE|ELSIF|EXCEPTION)\b/i.test(line)) indent = Math.max(0, indent - 1);
    out.push(`${'    '.repeat(indent)}${line}`);
    if (/^(DECLARE|BEGIN|IF\b.*THEN|LOOP\b|FOR\b.*LOOP|WHILE\b.*LOOP|EXCEPTION)\b/i.test(line) && !/^END\b/i.test(line)) indent += 1;
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

export function formatSourceCode(code = '', language = '') {
  const text = decodeEscapedCode(code);
  if (!text.trim()) return '';
  if (language === 'Python') return formatPython(text);
  if (['C', 'C++', 'Java', 'PHP'].includes(language)) return formatBracedLanguage(text);
  if (language === 'COBOL') return formatCobol(text);
  if (language === 'PL/SQL') return formatPlsql(text);
  return normalizeLines(text);
}
