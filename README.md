# TalentLens — AI Resume & ATS Analyzer

A deployable Next.js 15 app: marketing site + full auth (email/password, Google, GitHub via NextAuth.js) +
a dashboard with a rule-based ATS resume scanner (ported from the demo engine — swap in a real LLM call
in `lib/atsEngine.ts` when you're ready).

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- NextAuth.js (Auth.js v5) — Credentials + Google + GitHub
- Prisma ORM — SQLite by default, swappable to Postgres
- Recharts, lucide-react, mammoth (.docx parsing), zod

## Troubleshooting

- **`npm error ERESOLVE`**: dependencies are now pinned to React 18.3 (Next.js 15 supports both 18 and 19,
  but several libraries here — lucide-react, recharts, react-hook-form — have inconsistent React 19 peer
  ranges depending on version). A `.npmrc` with `legacy-peer-deps=true` is also included as a safety net, so
  `npm install` should no longer hard-fail on peer conflicts even if you add packages later.
- **`'next' is not recognized as an internal or external command`**: this means `npm install` didn't
  actually finish (it exited early on the error above), so `node_modules/.bin` was never created. Re-run
  `npm install` after the fix above — you don't need to install `next` globally.

## 1. Local setup

```bash
npm install
cp .env.example .env
```

Open `.env` and set `AUTH_SECRET` to a random string — generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the output in as `AUTH_SECRET="..."`. Leave `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID` etc. blank for now —
email/password login works without them.

Then create the database and start the app:

```bash
npm run db:push
npm run dev
```

`npm run dev` now runs a pre-check (`scripts/check-env.js`) first and will print a clear message and refuse
to start if `AUTH_SECRET` is missing or the database hasn't been created — instead of the generic Auth.js
"server configuration" error you'd otherwise see in the browser.

Visit http://localhost:3000, register an account, log in, and go to **Dashboard → Analyze Resume**.

## 2. OAuth setup (optional but recommended)

**Google** — https://console.cloud.google.com/apis/credentials
- Create an OAuth Client ID (Web application)
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (and your prod URL later)
- Copy Client ID/Secret into `.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

**GitHub** — https://github.com/settings/developers → New OAuth App
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
- Copy Client ID/Secret into `.env` as `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

## 3. Switching to Postgres (Supabase / Neon / RDS) for production

SQLite is great for local dev but Vercel's filesystem is read-only/ephemeral in production, so you need a
real Postgres database before deploying.

1. Create a free Postgres DB on [Supabase](https://supabase.com) or [Neon](https://neon.tech)
2. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` to the Postgres connection string in your environment
4. Run `npx prisma db push` (or `npx prisma migrate deploy` for tracked migrations)

No other application code needs to change — Prisma abstracts the rest.

## 4. Deploying to Vercel

1. Push this project to a GitHub repo
2. Import the repo at https://vercel.com/new
3. Add environment variables in the Vercel project settings (same keys as `.env.example`), using your
   production Postgres URL, a fresh `AUTH_SECRET`, your real `NEXTAUTH_URL` (your Vercel domain), and
   production OAuth credentials with redirect URIs updated to `https://your-domain/api/auth/callback/...`
4. Deploy. Vercel runs `prisma generate` automatically via the `postinstall` script.
5. Run `npx prisma db push` once against the production `DATABASE_URL` (e.g. from your local machine or a
   one-off Vercel deploy hook) to create the tables.

## Project structure

```
app/
  page.tsx                 marketing landing page
  login/, register/, forgot-password/    auth pages
  api/auth/[...nextauth]/   NextAuth route handler
  api/auth/register/        credentials sign-up endpoint
  api/reports/               save/list ATS scan results
  dashboard/                 protected app (layout.tsx checks session via middleware.ts)
    analyze/                 resume vs JD scanner UI
    history/                 saved reports table
    settings/                account settings shell
lib/
  auth.ts                   NextAuth config (providers, callbacks)
  prisma.ts                 Prisma client singleton
  atsEngine.ts              rule-based scoring engine — replace with an LLM call for real AI analysis
components/                 shared UI (Navbar, Sidebar, AuthShell, AnalysisResults, etc.)
prisma/schema.prisma        User/Account/Session (NextAuth) + ResumeReport models
middleware.ts               redirects unauthenticated users away from /dashboard
```

## Known limitations (by design, for this starter)

- **PDF upload isn't parsed** — the UI accepts `.docx` and `.txt` (via `mammoth`) and prompts for pasted
  text otherwise. Wire up `pdfjs-dist` server-side if you need PDF extraction.
- **Forgot-password is a UI stub** — no email is actually sent. Wire it to Resend/SendGrid/Postmark and
  generate a real reset token before using it in production.
- **The ATS "AI Suggestions" are rule-based**, not from an LLM. `lib/atsEngine.ts` is the single place to
  swap in an OpenAI/Gemini call for semantic scoring and resume rewriting.
- **Settings page fields are read-only** — hook them up to a server action when you add profile editing.

