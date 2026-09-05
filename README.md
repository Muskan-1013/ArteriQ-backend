# ArteriQ Backend (Node.js port)

This replaces the original Motoko/ICP canister backend with a plain Express + SQLite server.

## Endpoints

| Method | Path          | Auth?  | Body / Query                          | Description                          |
|--------|---------------|--------|----------------------------------------|---------------------------------------|
| POST   | /signup       | No     | `{ name, email, password }`            | Create an account                     |
| POST   | /login        | No     | `{ email, password }`                  | Returns `{ token }`                   |
| POST   | /logout       | Bearer | -                                       | Invalidate the session token          |
| GET    | /me           | Bearer | -                                       | Current user, or `null`               |
| POST   | /assess-risk  | No     | RiskAssessmentInput (see below)        | Returns a RiskReport                  |
| POST   | /reports      | Bearer | `{ report: RiskReport }`               | Save a report for the logged-in user  |
| GET    | /reports      | Bearer | -                                       | List the logged-in user's reports     |
| GET    | /api-doc      | No     | -                                       | Plain-text API description            |

Auth is passed as `Authorization: Bearer <token>` (the frontend should store the token it gets back from `/login`, e.g. in memory or `sessionStorage`/`localStorage`, then send it on every subsequent request).

### RiskAssessmentInput shape

```json
{
  "heartRate": 72,
  "stSegment": 0.1,
  "qtInterval": 400,
  "prInterval": 160,
  "qrsDuration": 100,
  "rrInterval": 800,
  "complexes": "normal morphology",
  "spo2": 98,
  "temperature": 36.8
}
```

## Running locally

```bash
npm install
npm start
```

The server listens on port 3001 by default (override with `PORT=xxxx`).

## Deployment

This uses a local SQLite file (`arteriq.db`), so it needs a host with a **persistent filesystem** — a real server, not stateless serverless functions. Good options:

- **Render** (Web Service, free tier available)
- **Railway**
- A VPS (DigitalOcean, Linode, etc.)

If you later want to deploy this as Vercel serverless functions instead, swap `better-sqlite3` for a hosted database (e.g. Supabase or Neon Postgres) since serverless functions don't keep local files between requests.

## Connecting the frontend

In the frontend, replace all calls that currently go through `src/frontend/src/backend.ts` (the ICP canister actor) with plain `fetch`/`axios` calls to this server's URL, e.g.:

```ts
const API_URL = import.meta.env.VITE_API_URL; // e.g. https://your-backend.onrender.com

await fetch(`${API_URL}/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

The Internet Identity login flow (`useAuth.tsx`, `LoginPage.tsx`) should also be replaced with a plain email/password form posting to `/signup` and `/login`.
