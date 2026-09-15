# Deployment

## Client
Build with `npm run build --prefix client` and deploy `client/dist` to Vercel or another static host.

Set `VITE_API_URL` to the public API base URL if the client is not served by the same origin.

## API
Run the Express server on Render/Railway/Fly.io/a VM. Ensure the host can reach MongoDB Atlas.

## Behavioral verification on Render
Render web services should not be expected to have a Docker daemon for launching child sandbox containers. This build supports two execution modes:

- `EXECUTION_MODE=docker` for local development with Docker Desktop (or another host that exposes a Docker daemon).
- `EXECUTION_MODE=judge0` for hosted deployments. Set `JUDGE0_URL` to a Judge0-compatible endpoint (the official CE endpoint is `https://ce.judge0.com`) and set `JUDGE0_AUTH_TOKEN` when the endpoint requires authentication.

Judge0 receives one submission for each source/target test execution, applies language/runtime limits, and returns stdout/stderr/status. CodeProof still performs the independent behavioral comparison and calculates the verification score. The execution adapter does not alter translation prompts or translation logic. Judge0 CE documents submissions, runtime constraints and status polling in its API reference.

For production, use an authenticated Judge0-compatible instance or service with an appropriate quota/SLA for your traffic. Avoid exposing the Judge0 token to the browser.

## Cookies
Enable `COOKIE_SECURE=true` behind HTTPS and configure `FRONTEND_URL` exactly to the deployed client origin.
