import dotenv from 'dotenv';
import path from 'node:path';

// Load server/.env first, then fall back to the project-root .env.
// This keeps secrets server-side while remaining compatible with the
// original CodeProof layout where a single root .env was used.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const bool = (v, fallback = false) =>
  (v === undefined ? fallback : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeproof',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
  groqKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  geminiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  executionMode: process.env.EXECUTION_MODE || 'docker',
  executionTimeout: Number(process.env.EXECUTION_TIMEOUT || 5000),
  maxCodeSize: Number(process.env.MAX_CODE_SIZE || 50000),
  dockerMemory: process.env.DOCKER_MEMORY || '256m',
  dockerCpus: process.env.DOCKER_CPUS || '0.5',
  demoMode: bool(process.env.DEMO_MODE, false),
};
