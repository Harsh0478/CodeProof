# Deployment

## Client
Build with `npm run build --prefix client` and deploy `client/dist` to Vercel or another static host.

Set `VITE_API_URL` to the public API base URL if the client is not served by the same origin.

## API
Run the Express server on Render/Railway/Fly.io/a VM. Ensure the host can reach MongoDB Atlas and, for live verification, Docker.

## Sandbox
Prefer a dedicated worker/VM where Docker is available. Serverless deployments should not be used as the code execution host.

## Cookies
Enable `COOKIE_SECURE=true` behind HTTPS and configure `FRONTEND_URL` exactly to the deployed client origin.
