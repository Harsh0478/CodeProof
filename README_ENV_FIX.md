# CodeProof environment fix

If Translate & Verify shows `Something went wrong on the server` and Settings shows Groq/Gemini as Not configured, the backend cannot see the provider credentials.

Put server secrets in either:
- `server/.env` (recommended), or
- the project-root `.env` (supported for backward compatibility).

Client-only setting:
- `client/.env` -> `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL`

After editing environment variables, restart both dev processes:

```powershell
npm run dev
```

Do not put GROQ_API_KEY, GEMINI_API_KEY, CLERK_SECRET_KEY, or MONGODB_URI in `client/.env`.

## Verification engine fix

The current build normalizes double-escaped AI-generated source code before execution, preserves COBOL DISPLAY line behavior when translating to Java, compiles once per program, executes tests sequentially, and uses the original program's stdout as the behavioral baseline.
