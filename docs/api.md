# API Reference

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Languages
- `GET /api/languages`
- `GET /api/languages/pairs`

## Translation
- `POST /api/translations/run`
- `POST /api/translations`
- `GET /api/translations`
- `GET /api/translations/:id`
- `DELETE /api/translations/:id`

## Verification
- `POST /api/verification/run`
- `POST /api/verification/run-test`
- `POST /api/verification/run-all`

## Test cases
- `POST /api/test-cases`
- `GET /api/test-cases/:translationId`
- `PUT /api/test-cases/:id`
- `DELETE /api/test-cases/:id`

## Dashboard
- `GET /api/dashboard/stats`

## Samples
- `GET /api/samples`
- `GET /api/samples/:id`

All private endpoints require the auth cookie.

## Samples CRUD

All sample endpoints require authentication.

- `GET /api/samples` — built-in samples plus samples created by the signed-in user.
- `GET /api/samples/:id` — retrieve one accessible sample.
- `POST /api/samples` — create a reusable user sample.
- `PUT /api/samples/:id` — update a user-owned sample.
- `DELETE /api/samples/:id` — delete a user-owned sample.

Built-in samples are read-only. The Samples page provides **Add Sample**, **Use Sample**, **Edit**, **Delete**, and **Copy** actions.

## Authentication with Clerk

Frontend requests obtain a Clerk session token with Clerk's React `getToken()` helper and send it as `Authorization: Bearer <token>`. The Express API installs `clerkMiddleware()` and protected handlers call `getAuth(req)` to verify the session. The server uses Clerk's backend user API to link the Clerk identity to the application's MongoDB `User` record on first authenticated access.
