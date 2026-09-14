# Security

User code is untrusted. The execution layer uses Docker by default, disables networking, limits CPU/memory and timeout, runs as non-root and does not mount application secrets or the host filesystem.

Production recommendation: place execution on a dedicated worker host, restrict Docker daemon access, set hard resource quotas and monitor container creation. `local-dev` mode is intentionally marked as unsafe for public deployment.

## Clerk authentication

Passwords and application-managed JWT cookies are no longer used by CodeProof. Clerk manages sign-in/sign-up and session security. Only `VITE_CLERK_PUBLISHABLE_KEY` is exposed to the client. `CLERK_SECRET_KEY` is backend-only and must never be placed in Vite environment variables or frontend source.
