import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

const configs = {
  C: { image: 'gcc:14', file: 'main.c', compile: ['gcc', 'main.c', '-O2', '-o', 'app'], run: ['./app'] },
  'C++': { image: 'gcc:14', file: 'main.cpp', compile: ['g++', '-std=c++17', 'main.cpp', '-O2', '-o', 'app'], run: ['./app'] },
  Java: { image: 'eclipse-temurin:21-jdk-alpine', file: 'Main.java', compile: ['javac', 'Main.java'], run: ['java', 'Main'] },
  Python: { image: 'python:3.13-alpine', file: 'main.py', compile: null, run: ['python3', 'main.py'] },
  PHP: { image: 'php:8.5-cli-alpine', file: 'main.php', compile: null, run: ['php', 'main.php'] },
  COBOL: { image: 'codeproof/gnucobol:3.2', file: 'main.cob', compile: ['cobc', '-x', '-free', 'main.cob', '-o', 'app'], run: ['./app'] },
  'PL/SQL': { image: null, file: 'main.sql', compile: null, run: null }
};

const judge0LanguageIds = {
  // Official Judge0 CE language IDs (v1.13.x). COBOL is not included in CE.
  C: 48,
  'C++': 52,
  Java: 62,
  Python: 71,
  PHP: 68,
};

const judge0TerminalStatuses = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

function judge0Headers() {
  const headers = { 'Content-Type': 'application/json' };
  if (env.judge0AuthToken) headers['X-Auth-Token'] = env.judge0AuthToken;
  return headers;
}

function judge0CodeFor(language, code) {
  // Judge0 Java runner expects Main as the entry-point class. Preserve all other source code.
  if (language !== 'Java') return code;
  const publicClass = code.match(/\bpublic\s+class\s+([A-Za-z_$][\w$]*)\b/);
  if (!publicClass || publicClass[1] === 'Main') return code;
  return code.replace(new RegExp(`\\bpublic\\s+class\\s+${publicClass[1]}\\b`), 'public class Main');
}

function judge0Status(statusId) {
  if (statusId === 3) return 'PASS';
  if (statusId === 6) return 'COMPILATION_ERROR';
  if ([5, 8, 9, 10, 11, 12, 13, 14, 15, 16].includes(statusId)) return 'RUNTIME_ERROR';
  return 'UNAVAILABLE';
}

function judge0Error(result) {
  return result?.compile_output || result?.stderr || result?.message || result?.status?.description || 'Remote execution failed.';
}

async function judge0Request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(env.judge0PollTimeout, env.executionTimeout + 5000));
  try {
    const response = await fetch(url, { ...options, headers: { ...judge0Headers(), ...(options.headers || {}) }, signal: controller.signal });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = { message: text }; }
    if (!response.ok) {
      const error = new Error(body?.message || body?.error || `Judge0 returned HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function judge0Submit(language, code, input = '') {
  const languageId = judge0LanguageIds[language];
  if (!languageId) {
    return { status: 'UNAVAILABLE', stdout: '', stderr: `${language} execution is not available on the configured Judge0 CE instance. Use a Judge0 Extra/self-hosted endpoint for this language.`, executionTime: 0, compilation: false };
  }

  const started = Date.now();
  try {
    const created = await judge0Request(`${env.judge0Url}/submissions/?base64_encoded=false&wait=false`, {
      method: 'POST',
      body: JSON.stringify({
        language_id: languageId,
        source_code: judge0CodeFor(language, code),
        stdin: input ?? '',
        cpu_time_limit: Math.max(1, Math.min(Math.ceil(env.executionTimeout / 1000), 15)),
        wall_time_limit: Math.max(2, Math.min(Math.ceil((env.executionTimeout * 2) / 1000), 20)),
        memory_limit: 128000,
        max_processes_and_or_threads: 32,
        enable_per_process_and_thread_memory_limit: true,
        enable_per_process_and_thread_time_limit: true,
      })
    });

    if (!created?.token) throw new Error('Judge0 did not return a submission token.');

    const deadline = Date.now() + env.judge0PollTimeout;
    while (Date.now() < deadline) {
      const result = await judge0Request(`${env.judge0Url}/submissions/${encodeURIComponent(created.token)}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time,memory,token`);
      const statusId = result?.status?.id;
      if (judge0TerminalStatuses.has(statusId)) {
        const status = judge0Status(statusId);
        return {
          status,
          stdout: result?.stdout || '',
          stderr: judge0Error(result),
          executionTime: Math.max(Date.now() - started, Number(result?.time || 0) * 1000),
          compilation: statusId !== 6,
          rawStatus: result?.status?.description || ''
        };
      }
      await new Promise((resolve) => setTimeout(resolve, env.judge0PollMs));
    }
    return { status: 'RUNTIME_ERROR', stdout: '', stderr: 'Remote execution timed out.', executionTime: Date.now() - started, compilation: true };
  } catch (error) {
    return { status: 'UNAVAILABLE', stdout: '', stderr: error?.message || 'Remote execution service unavailable.', executionTime: Date.now() - started, compilation: false };
  }
}

function spawnProcess(command, options, input = '', timeoutMs = env.executionTimeout) {
  return new Promise((resolve) => {
    const started = Date.now();
    let child;
    try {
      child = spawn(command[0], command.slice(1), options);
    } catch (error) {
      resolve({ code: null, stdout: '', stderr: error?.message || String(error), timedOut: false, spawnError: error, executionTime: Date.now() - started });
      return;
    }

    let stdout = '';
    let stderr = '';
    let spawnError = null;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ...result, executionTime: Date.now() - started });
    };

    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
      // close event normally follows; preserve the timeout marker.
      child.__codeproofTimedOut = true;
    }, timeoutMs);

    child.stdout?.on('data', (data) => { stdout += data; });
    child.stderr?.on('data', (data) => { stderr += data; });
    child.once('error', (error) => {
      spawnError = error;
      finish({ code: null, stdout, stderr: error?.message || stderr, timedOut: child.__codeproofTimedOut || false, spawnError });
    });
    child.once('close', (code) => {
      finish({ code, stdout, stderr, timedOut: child.__codeproofTimedOut || false, spawnError });
    });

    child.stdin?.end(input ?? '');
  });
}

function localCommand(command, cwd, input, timeoutMs = env.executionTimeout) {
  return spawnProcess(command, { cwd, shell: false, stdio: ['pipe', 'pipe', 'pipe'] }, input, timeoutMs);
}

async function ensureDockerImage(image) {
  if (!image || env.executionMode !== 'docker') return { ok: true };
  const inspect = await localCommand(['docker', 'image', 'inspect', image], process.cwd(), '', Math.max(env.executionTimeout, 10000));
  if (inspect.code === 0) return { ok: true };
  if (isSpawnFailure(inspect) || isDockerUnavailableResult(inspect) || inspect.code === null) {
    return { ok: false, error: unavailableMessage(image, inspect) };
  }

  const pull = await localCommand(['docker', 'pull', image], process.cwd(), '', 120000);
  if (pull.code === 0 && !pull.timedOut && !pull.spawnError) return { ok: true };
  const detail = pull.stderr || pull.stdout || inspect.stderr || inspect.stdout || 'Unable to prepare Docker image.';
  return { ok: false, error: detail.trim() };
}

function shellQuote(value = '') {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function dockerCommand(image, command, cwd, input = '', timeoutMs = env.executionTimeout) {
  // Execute through a tiny shell wrapper so stdout/stderr are simultaneously
  // streamed and persisted to the bind-mounted workspace. The persisted files
  // provide a second reliable capture path for very short-lived programs.
  const inputFile = path.join(cwd, '.codeproof-input.txt');
  const outputFile = path.join(cwd, '.codeproof-output.txt');
  const errorFile = path.join(cwd, '.codeproof-error.txt');
  const commandText = command.map(shellQuote).join(' ');
  const script = [
    `: > /workspace/.codeproof-output.txt`,
    `: > /workspace/.codeproof-error.txt`,
    `${commandText} < /workspace/.codeproof-input.txt > /workspace/.codeproof-output.txt 2> /workspace/.codeproof-error.txt`,
    'code=$?',
    'cat /workspace/.codeproof-output.txt',
    'cat /workspace/.codeproof-error.txt >&2',
    'exit $code'
  ].join('; ');

  return fs.writeFile(inputFile, input ?? '', 'utf8').then(() =>
    localCommand([
      'docker', 'run', '--rm', '-i',
      '--network', 'none',
      '--cpus', env.dockerCpus,
      '--memory', env.dockerMemory,
      '--pids-limit', '64',
      '--read-only',
      '--tmpfs', '/tmp:rw,nosuid,nodev,noexec,size=64m',
      '-v', `${cwd}:/workspace:rw`,
      '-w', '/workspace',
      image,
      'sh', '-c', script
    ], cwd, '', timeoutMs)
  ).then(async (result) => {
    let fileStdout = '';
    let fileStderr = '';
    try { fileStdout = await fs.readFile(outputFile, 'utf8'); } catch {}
    try { fileStderr = await fs.readFile(errorFile, 'utf8'); } catch {}
    return {
      ...result,
      stdout: fileStdout || result.stdout || '',
      stderr: fileStderr || result.stderr || ''
    };
  });
}

function detectJavaClassName(code) {
  const publicClass = code.match(/\bpublic\s+class\s+([A-Za-z_$][\w$]*)\b/);
  if (publicClass) return publicClass[1];
  const classMatch = code.match(/\bclass\s+([A-Za-z_$][\w$]*)\b/);
  return classMatch ? classMatch[1] : 'Main';
}

function buildConfig(language, code) {
  const base = configs[language];
  if (!base) return null;
  if (language !== 'Java') return base;

  const className = detectJavaClassName(code);
  return {
    ...base,
    file: `${className}.java`,
    compile: ['javac', `${className}.java`],
    run: ['java', className]
  };
}

function isSpawnFailure(result) {
  return Boolean(result?.spawnError);
}

function isDockerUnavailableResult(result) {
  if (env.executionMode !== 'docker' || !result) return false;
  const text = `${result.stderr || ''}\n${result.stdout || ''}`.toLowerCase();
  return /docker (?:daemon|api)|dockerdesktoplinuxengine|cannot connect to the docker daemon|failed to connect to the docker api|is the docker daemon running|error during connect/.test(text);
}

function unavailableMessage(language, result) {
  if (isSpawnFailure(result)) {
    if (result.spawnError?.code === 'ENOENT' && env.executionMode === 'docker') {
      return 'Docker is not available. Start Docker Desktop and try again.';
    }
    return result.stderr || `Execution command for ${language} could not be started.`;
  }
  return result.stderr || 'Execution environment unavailable.';
}

async function createPrepared(language, code) {
  const cfg = buildConfig(language, code);
  if (!cfg) throw new AppError(`Execution is not configured for ${language}.`, 422, 'EXECUTION_UNAVAILABLE');
  if (!cfg.run) {
    return { status: 'UNAVAILABLE', language, code, cfg, dir: null, error: `${language} execution requires an Oracle-compatible runtime adapter.` };
  }

  if (env.executionMode === 'docker') {
    const image = await ensureDockerImage(cfg.image);
    if (!image.ok) {
      return { status: 'UNAVAILABLE', language, code, cfg, dir: null, error: `Docker runtime unavailable: ${image.error}`, compilation: false };
    }
  }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeproof-'));
  await fs.writeFile(path.join(dir, cfg.file), code, 'utf8');

  if (!cfg.compile) return { status: 'READY', language, code, cfg, dir, compilationTime: 0 };

  const compileResult = env.executionMode === 'docker'
    ? await dockerCommand(cfg.image, cfg.compile, dir, '', Math.max(env.executionTimeout, 10000))
    : await localCommand(cfg.compile, dir, '');

  if (isSpawnFailure(compileResult) || isDockerUnavailableResult(compileResult)) {
    return { status: 'UNAVAILABLE', language, code, cfg, dir, error: unavailableMessage(language, compileResult), compilation: false, compilationResult: compileResult };
  }
  if (compileResult.timedOut) return { status: 'COMPILATION_ERROR', language, code, cfg, dir, error: 'Compilation timed out.', compilation: false, compilationResult: compileResult };
  if (compileResult.code !== 0) return { status: 'COMPILATION_ERROR', language, code, cfg, dir, error: compileResult.stderr || compileResult.stdout || 'Compilation failed.', compilation: false, compilationResult: compileResult };

  return { status: 'READY', language, code, cfg, dir, compilation: true, compilationResult: compileResult };
}

async function runPrepared(prepared, input = '') {
  if (prepared.status === 'UNAVAILABLE') return { status: 'UNAVAILABLE', stdout: '', stderr: prepared.error, executionTime: 0, compilation: false };
  if (prepared.status === 'COMPILATION_ERROR') return { status: 'COMPILATION_ERROR', stdout: '', stderr: prepared.error, executionTime: prepared.compilationResult?.executionTime || 0, compilation: false };

  const runResult = env.executionMode === 'docker'
    ? await dockerCommand(prepared.cfg.image, prepared.cfg.run, prepared.dir, input, env.executionTimeout)
    : await localCommand(prepared.cfg.run, prepared.dir, input);

  if (isSpawnFailure(runResult) || isDockerUnavailableResult(runResult)) return { status: 'UNAVAILABLE', stdout: runResult.stdout || '', stderr: unavailableMessage(prepared.language, runResult), executionTime: runResult.executionTime, compilation: true };
  if (runResult.timedOut) return { status: 'RUNTIME_ERROR', stdout: runResult.stdout || '', stderr: 'Execution timed out.', executionTime: runResult.executionTime, compilation: true };
  if (runResult.code !== 0) return { status: 'RUNTIME_ERROR', stdout: runResult.stdout || '', stderr: runResult.stderr || `Process exited with code ${runResult.code}.`, executionTime: runResult.executionTime, compilation: true };

  return { status: 'PASS', stdout: runResult.stdout || '', stderr: runResult.stderr || '', executionTime: (prepared.compilationResult?.executionTime || 0) + runResult.executionTime, compilation: true };
}

async function executeBatch(language, code, inputs = []) {
  const safeInputs = Array.isArray(inputs) ? inputs : [];
  if (env.executionMode === 'judge0') {
    const results = [];
    for (const input of safeInputs) results.push(await judge0Submit(language, code, input));
    return results;
  }
  if (env.executionMode === 'docker') {
    const preflight = await localCommand(['docker', 'info', '--format', '{{.ServerVersion}}'], process.cwd(), '', Math.max(env.executionTimeout, 10000));
    if (isSpawnFailure(preflight) || isDockerUnavailableResult(preflight) || preflight.code !== 0) {
      const message = unavailableMessage(language, preflight);
      return safeInputs.map(() => ({ status: 'UNAVAILABLE', stdout: '', stderr: message, executionTime: preflight.executionTime || 0, compilation: false }));
    }
  }

  const prepared = await createPrepared(language, code);
  try {
    if (prepared.status === 'UNAVAILABLE' || prepared.status === 'COMPILATION_ERROR') {
      return await Promise.all(safeInputs.map(() => runPrepared(prepared)));
    }
    const results = [];
    for (const input of safeInputs) results.push(await runPrepared(prepared, input));
    return results;
  } finally {
    if (prepared.dir) await fs.rm(prepared.dir, { recursive: true, force: true });
  }
}

export const ExecutionService = {
  execute: async (language, code, input = '') => (await executeBatch(language, code, [input]))[0],
  executeBatch,
  prepare: createPrepared,
  runPrepared
};
