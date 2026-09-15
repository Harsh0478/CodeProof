import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { AlignJustify, Copy, Maximize2, Trash2 } from 'lucide-react';

const map = { C: 'c', 'C++': 'cpp', Java: 'java', Python: 'python', PHP: 'php', 'PL/SQL': 'sql', COBOL: 'plaintext' };
const braceLanguages = new Set(['C', 'C++', 'Java', 'PHP', 'PL/SQL']);

function stripFences(code = '') {
  return code
    .replace(/^\s*```(?:[a-zA-Z0-9_+.#-]+)?\s*\n?/, '')
    .replace(/\n?\s*```\s*$/, '')
    .replace(/\r\n/g, '\n');
}

function splitStructuralLines(code) {
  let out = '';
  let inString = false;
  let quote = '';
  let escape = false;
  let lineComment = false;
  let blockComment = false;
  let parenDepth = 0;

  for (let i = 0; i < code.length; i += 1) {
    const ch = code[i];
    const next = code[i + 1];

    if (lineComment) {
      out += ch;
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      out += ch;
      if (ch === '*' && next === '/') {
        out += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }
    if (!inString && ch === '/' && next === '/') {
      out += '//';
      i += 1;
      lineComment = true;
      continue;
    }
    if (!inString && ch === '/' && next === '*') {
      out += '/*';
      i += 1;
      blockComment = true;
      continue;
    }
    if (inString) {
      out += ch;
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === quote) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      out += ch;
      continue;
    }

    if (ch === '(') parenDepth += 1;
    if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);

    if (ch === '{') {
      out = out.trimEnd() + ' {\n';
      continue;
    }
    if (ch === '}') {
      out = out.trimEnd() + '\n}\n';
      continue;
    }
    if (ch === ';' && parenDepth === 0) {
      out += ';\n';
      continue;
    }
    out += ch;
  }
  return out;
}

function formatBracedCode(code) {
  const expanded = splitStructuralLines(stripFences(code));
  const rawLines = expanded.split('\n').map((line) => line.trim()).filter(Boolean);
  const formatted = [];
  let indent = 0;

  for (let line of rawLines) {
    if (line.startsWith('}')) indent = Math.max(0, indent - 1);
    line = line.replace(/\s+([,;])/g, '$1').replace(/[ \t]+$/g, '');
    formatted.push(`${'    '.repeat(indent)}${line}`);
    if (line.endsWith('{')) indent += 1;
  }

  return formatted.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function formatPython(code) {
  const lines = stripFences(code).split('\n');
  return lines
    .map((line) => line.replace(/[ \t]+$/g, '').replace(/^\t+/g, (m) => '    '.repeat(m.length)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatCode(code, language) {
  if (!code?.trim()) return '';
  if (braceLanguages.has(language)) return formatBracedCode(code);
  if (language === 'Python') return formatPython(code);
  return stripFences(code).trim();
}

export default function CodeEditor({
  label,
  value,
  onChange,
  language,
  readOnly = false,
  onClear,
  onCopy,
  theme,
  autoFormat = false,
}) {
  const editorRef = useRef(null);
  const suppressChangeRef = useRef(false);

  const applyFormat = () => {
    if (!editorRef.current || !value?.trim()) return;
    const formatted = formatCode(value, language);
    if (formatted && formatted !== value) {
      suppressChangeRef.current = true;
      editorRef.current.setValue(formatted);
      suppressChangeRef.current = false;
      onChange?.(formatted);
    }
  };

  useEffect(() => {
    if (autoFormat && value?.trim()) applyFormat();
    // Only the read-only generated editor enables auto-format, so rerunning on value changes is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFormat, value, language]);

  const handleMount = (editor) => {
    editorRef.current = editor;
    editor.addAction({
      id: 'codeproof-format',
      label: 'Format Code',
      keybindings: [],
      run: () => applyFormat(),
    });
    if (autoFormat) setTimeout(applyFormat, 0);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0f172a] shadow-sm dark:border-slate-700">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#111c31] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          {label}
          <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">{language}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          {readOnly && (
            <button title="Format code" onClick={applyFormat} className="focus-ring rounded-md p-1.5 hover:bg-white/10 hover:text-white">
              <AlignJustify size={14} />
            </button>
          )}
          <button title="Copy code" onClick={onCopy} className="focus-ring rounded-md p-1.5 hover:bg-white/10 hover:text-white">
            <Copy size={14} />
          </button>
          {onClear && !readOnly && (
            <button title="Clear" onClick={onClear} className="focus-ring rounded-md p-1.5 hover:bg-white/10 hover:text-white">
              <Trash2 size={14} />
            </button>
          )}
          <button title="Editor" className="focus-ring rounded-md p-1.5 hover:bg-white/10 hover:text-white">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
      <Editor
        height="380px"
        language={map[language] || 'plaintext'}
        value={value}
        onChange={(next) => {
          if (!suppressChangeRef.current) onChange?.(next ?? '');
        }}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          lineHeight: 22,
          minimap: { enabled: false },
          padding: { top: 12, bottom: 12 },
          wordWrap: 'off',
          readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          detectIndentation: false,
          formatOnPaste: true,
          formatOnType: false,
          bracketPairColorization: { enabled: true },
          guides: { indentation: true, bracketPairs: true },
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
