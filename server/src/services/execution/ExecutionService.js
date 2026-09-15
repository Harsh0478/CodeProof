import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

const configs = {
  C: { image: 'gcc:14-alpine', file: 'main.c', compile: ['gcc', 'main.c', '-O2', '-o', 'app'], run: ['./app'] },
  'C++': { image: 'gcc:14-alpine', file: 'main.cpp', compile: ['g++', '-std=c++17', 'main.cpp', '-O2', '-o', 'app'], run: ['./app'] },
  Java: { image: 'eclipse-temurin:21-jdk-alpine', file: 'Main.java', compile: ['javac', 'Main.java'], run: ['java', 'Main'] },
  Python: { image: 'python:3.13-alpine', file: 'main.py', compile: null, run: ['python3', 'main.py'] },
  PHP: { image: 'php:8.5-cli-alpine', file: 'main.php', compile: null, run: ['php', 'main.php'] },
  COBOL: { image: 'codeproof/gnucobol:3.2', file: 'main.cob', compile: ['cobc', '-x', '-free', 'main.cob', '-o', 'app'], run: ['./app'] },
  'PL/SQL': { image: null, file: 'main.sql', compile: null, run: null }
};

function spawnProcess(command, options, input = '') {
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
    let timedOut = false;
    let spawnError = null;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ...result, executionTime: Date.now() - started });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, env.executionTimeout);

    child.stdout?.on('data', (data) => { stdout += data; });
    child.stderr?.on('data', (data) => { stderr += data; });
    child.once('error', (error) => {
      spawnError = error;
      finish({ code: null, stdout, stderr: error?.message || stderr, timedOut, spawnError });
    });
    child.once('close', (code) => {
      finish({ code, stdout, stderr, timedOut, spawnError });
    });

    child.stdin?.end(input || '');
  });
}

function localCommand(command, cwd, input) {
  return spawnProcess(command, { cwd, shell: false, stdio: ['pipe', 'pipe', 'pipe'] }, input);
}

function dockerCommand(image, command, cwd, input) {
  const args = [
    'run', '--rm',
    '--network', 'none',
    '--cpus', env.dockerCpus,
    '--memory', env.dockerMemory,
    '--pids-limit', '64',
    '--read-only',
    '--tmpfs', '/tmp:rw,nosuid,nodev,noexec,size=64m',
    '-v', `${cwd}:/workspace:rw`,
    '-w', '/workspace',
    image,
    ...command
  ];
  return localCommand(['docker', ...args], cwd, input);
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
    return {
      status: 'UNAVAILABLE',
      language,
      code,
      cfg,
      dir: null,
      error: `${language} execution requires an Oracle-compatible runtime adapter.`
    };
  }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeproof-'));
  await fs.writeFile(path.join(dir, cfg.file), code, 'utf8');

  if (!cfg.compile) {
    return { status: 'READY', language, code, cfg, dir, compilationTime: 0 };
  }

  const compileResult = env.executionMode === 'docker'
    ? await dockerCommand(cfg.image, cfg.compile, dir, '')
    : await localCommand(cfg.compile, dir, '');

  if (isSpawnFailure(compileResult)) {
    return {
      status: 'UNAVAILABLE', language, code, cfg, dir,
      error: unavailableMessage(language, compileResult),
      compilation: false,
      compilationResult: compileResult
    };
  }

  if (compileResult.timedOut) {
    return {
      status: 'COMPILATION_ERROR', language, code, cfg, dir,
      error: 'Compilation timed out.', compilation: false, compilationResult: compileResult
    };
  }

  if (compileResult.code !== 0) {
    return {
      status: 'COMPILATION_ERROR', language, code, cfg, dir,
      error: compileResult.stderr || compileResult.stdout || 'Compilation failed.',
      compilation: false, compilationResult: compileResult
    };
  }

  return {
    status: 'READY', language, code, cfg, dir,
    compilation: true, compilationResult: compileResult
  };
}

async function runPrepared(prepared, input = '') {
  if (prepared.status === 'UNAVAILABLE') {
    return { status: 'UNAVAILABLE', stdout: '', stderr: prepared.error, executionTime: 0, compilation: false };
  }
  if (prepared.status === 'COMPILATION_ERROR') {
    return { status: 'COMPILATION_ERROR', stdout: '', stderr: prepared.error, executionTime: prepared.compilationResult?.executionTime || 0, compilation: false };
  }

  const runResult = env.executionMode === 'docker'
    ? await dockerCommand(prepared.cfg.image, prepared.cfg.run, prepared.dir, input)
    : await localCommand(prepared.cfg.run, prepared.dir, input);

  if (isSpawnFailure(runResult)) {
    return { status: 'UNAVAILABLE', stdout: runResult.stdout, stderr: unavailableMessage(prepared.language, runResult), executionTime: runResult.executionTime, compilation: true };
  }
  if (runResult.timedOut) {
    return { status: 'RUNTIME_ERROR', stdout: runResult.stdout, stderr: 'Execution timed out.', executionTime: runResult.executionTime, compilation: true };
  }
  if (runResult.code !== 0) {
    return { status: 'RUNTIME_ERROR', stdout: runResult.stdout, stderr: runResult.stderr, executionTime: runResult.executionTime, compilation: true };
  }

  return {
    status: 'PASS',
    stdout: runResult.stdout,
    stderr: runResult.stderr,
    executionTime: (prepared.compilationResult?.executionTime || 0) + runResult.executionTime,
    compilation: true
  };
}

async function executeBatch(language, code, inputs = []) {
  const prepared = await createPrepared(language, code);
  try {
    if (prepared.status === 'UNAVAILABLE' || prepared.status === 'COMPILATION_ERROR') {
      return inputs.map(() => runPrepared(prepared));
    }
    const results = [];
    for (const input of inputs) {
      results.push(await runPrepared(prepared, input));
    }
    return results;
  } finally {
    if (prepared.dir) await fs.rm(prepared.dir, { recursive: true, force: true });
  }
}

export const ExecutionService = {
  execute: async (language, code, input = '') => {
    const results = await executeBatch(language, code, [input]);
    return results[0];
  },
  executeBatch,
  prepare: createPrepared,
  runPrepared
};
