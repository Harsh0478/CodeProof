# CodeProof + Clerk CLI

CodeProof uses Clerk for authentication in the React/Vite frontend and Express API.

## Current Clerk CLI workflow

The current Clerk CLI separates application linking from initialization. After installing the CLI, authenticate first, link this repository to the supplied CodeProof Clerk application, then run initialization/doctor as needed.

```bash
npm install -g clerk
clerk auth login
clerk link --app app_3JJgLmuXkrEgyMmPcZcqWVw4kwR
clerk init
clerk doctor
```

The repository already contains the Clerk React provider and Express middleware integration, so initialization should be treated as a verification/linking step rather than a request to replace the application's architecture.

## Local environment

Frontend (`client/.env` or your Vite environment file):

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:5000/api
```

Backend (`server/.env`):

```env
CLERK_SECRET_KEY=sk_test_...
```

Never put `CLERK_SECRET_KEY` in client code.

## Existing authentication architecture

The frontend uses `@clerk/react` with `ClerkProvider`, `SignIn`, `SignUp`, `UserButton`, and `useAuth`/`useUser`. The API client obtains a Clerk session token with `getToken()` and sends it as a bearer token.

The Express server installs `clerkMiddleware()` before the API routes. Protected routes use `getAuth(req)` and map the Clerk user to the CodeProof MongoDB `User` document by `clerkUserId` (falling back to email for legacy records).

## Authentication methods

Configure these in the linked Clerk application:

- Google OAuth
- Email + password
- Phone number + OTP

Clerk controls the availability of these sign-in/sign-up methods. The CodeProof sign-in and sign-up pages use Clerk's prebuilt components, so once enabled in the application they appear without additional custom credential handling in this repository.

## Migration note

CodeProof previously had application-managed JWT/password authentication. The active authentication flow is now Clerk-backed. The local `passwordHash` field remains optional only so existing MongoDB records can be linked by email during migration; it is not used to authenticate new sessions.

## First user test

After the app is running:

1. Open `http://localhost:5173/login`.
2. Create a test account with one of the configured methods.
3. After sign-in, confirm the profile control appears in the top navigation.
4. Open Dashboard and confirm `/api/auth/me` resolves the Clerk user to a CodeProof MongoDB user.
5. Test a protected workflow such as Samples or Translate.

For production, claim/link the correct Clerk application and configure the production instance/domain before deployment.
