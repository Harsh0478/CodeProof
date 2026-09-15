# Render deployment: behavioral verification

This build keeps the existing local Docker executor and adds a hosted `judge0` execution mode.

## Render environment variables

```env
EXECUTION_MODE=judge0
JUDGE0_URL=https://ce.judge0.com
JUDGE0_AUTH_TOKEN=
EXECUTION_TIMEOUT=5000
COOKIE_SECURE=true
FRONTEND_URL=https://YOUR-VERCEL-DOMAIN
```

`JUDGE0_AUTH_TOKEN` is optional only when the configured Judge0 endpoint does not require authentication. Never put it in `client/.env` or any `VITE_` variable.

## Health check

After deployment, open:

```text
https://YOUR-RENDER-DOMAIN/api/health
```

Expected shape:

```json
{
  "success": true,
  "status": "ok",
  "services": {
    "groq": true,
    "gemini": true,
    "execution": "judge0",
    "judge0": true
  }
}
```

## Verification

Use a small deterministic test such as C -> Java Even/Odd. CodeProof will still compile/execute the original and generated program through the execution adapter and compare outputs before assigning a score.

## Local behavior

For local Docker Desktop verification, keep:

```env
EXECUTION_MODE=docker
```

The new `judge0` mode is selected only through the environment, so the existing Docker workflow remains available locally.
