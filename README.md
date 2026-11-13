# InterviewBuddy — Next.js

Standard Next.js 16 App Router, React 19, TypeScript, and Supabase. No Vinext, Vite, Wrangler, D1, or Sites runtime dependencies remain.

## Run locally

```sh
npm ci
cp .env.example .env.local # Only for a fresh checkout; preserve existing configured values
npm run dev
```

Open http://localhost:3000. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. The current workspace is already configured for the existing InterviewBuddy project. Never put a service-role key in a `NEXT_PUBLIC_` variable.

```sh
npm run typecheck
npm run build
npm start
```

## Implemented initial slice

- Responsive light/dark learning workspace and eight skill cards.
- Supabase-backed library with 16 questions, search, skill/difficulty filters, answer explanations, and examples.
- Email/password signup, login, logout, recovery, and password update UI.
- Bookmarks, confidence, and private notes saved to Supabase.
- Interview create/edit, status, current round, scheduled date/time, private notes, and per-round questions.
- Four public prompt templates with live placeholders and copy; users can create/edit private prompts.
- Role-protected question/answer draft, publish, archive, and shared-prompt editors.
- Step-through event-loop explainer and reduced-motion support.
- Clearly labeled future AI voice screen; no AI API or microphone capture implemented.

## Authentication setup still required

1. In Supabase Authentication URL Configuration, allow the exact local origin (`http://127.0.0.1:3000` and/or `http://localhost:3000`) and eventual deployment origin for email confirmation/recovery.
2. Confirm email delivery behavior. Production needs a configured SMTP provider and rate-limit review.
3. The intended administrator must sign up and verify their email. Grant their `auth.users.id` the `admin` role in `public.user_roles` from a trusted SQL session. Never enable client writes to that table. The chosen account has not yet been provisioned.
4. Google OAuth is deliberately hidden until configured in Supabase. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` only after verifying its provider credentials and redirects.

Authentication is currently browser-managed by supabase-js; RLS enforces all data access. There is no server-rendered private session or service-role client. Public content currently loads client-side. A future route/SSR pass can improve indexing and initial loading.

## Database

The existing project already has these applied migrations; do not run the seed again:

1. `interviewbuddy_foundation` — initial section of `database/schema.sql`.
2. `interviewbuddy_starter_content` — `database/seed.sql`.
3. `restrict_private_table_grants` — final statements in `database/schema.sql`.
4. `consolidate_content_policies` — `database/refine-policies.sql`.

For a new empty database, apply `schema.sql`, `refine-policies.sql`, then `seed.sql` once. `seed.mjs` generates the seed SQL; it is not an idempotent production updater.

`database/verify-rls.sql` creates disposable fixtures in a transaction, checks ownership/admin policies, and rolls everything back. This has passed against the connected database. Run it only in a controlled environment; if a SQL client stops at an error while retaining its session, explicitly roll back.

## Known next steps

Real-account end-to-end auth and admin verification, dedicated interview-round records (currently a current-round field and question round labels), flashcards, submission moderation, taxonomy editing, pagination, dedicated page routes/SSR, more learning illustrations, and deployment remain on the roadmap. Personal record deletion is not exposed yet.

The earlier `.openai/hosting.json` retains an unused private Site registration as history. This Next.js application has not been published there. Standard `next build` produces `.next/` for a Next.js-compatible Node host such as Vercel; it is not a Cloudflare Worker artifact.

See [project documentation](../README.md) and [current implementation status](../docs/implementation-status.md).

## Production update — November 10, 2026

Production: https://interviewbuddy-henna.vercel.app (Vercel project `aslammacs-projects/interviewbuddy`). Section navigation now adds browser history entries, and Back/Forward restore the matching view. Admin features include counts, search/filter, bulk status changes, duplication, skill editing, and JSON draft import/export. The public library has 33 questions. The verified account `aslammac7@gmail.com` was assigned the admin role.

Supabase Auth production URL configuration still needs the site URL and redirect allowlist for `https://interviewbuddy-henna.vercel.app`. Supabase Dashboard required a separate sign-in during this session, so production email confirmation and password recovery redirects were not verified. Existing-account email/password sign-in can be used in the meantime.

## Content update — November 10, 2026

Added 24 reviewed starter questions (three per skill) with concise answers, plain-language explanations, and examples. The live Supabase library now contains 57 published questions. Source content and the applied SQL are in `database/question-batch-2026-11-10.mjs` and `.sql`. The public app reads Supabase at runtime, so this content update required no new deployment.

## Content update — 200-question milestone

Added 144 distinct questions across all eight skills, with 18 per skill. The live library now has 201 published questions and answers. The source batch and applied SQL are `database/question-batch-200.mjs` and `database/question-batch-200.sql`. Some new entries are concise Q&A without a separate explanation or example; the answer itself contains the key teaching point. Supabase migration: `interviewbuddy_200_questions_20261110`.

## Content update — 300 additional Q&As

Added exactly 300 Q&As across the eight skills (37–38 per skill). The published library now contains 501 questions with 501 unique titles. Each new concept has distinct definition, practical-use, and common-mistake questions; selected concepts also have an example question. Source and applied SQL: `database/question-batch-300.mjs` and `database/question-batch-300.sql`. Supabase migration: `interviewbuddy_300_more_questions_20261110`. The live app reads this content directly from Supabase; no code deployment was needed.

## Content update — another 300 Q&As

Added exactly 300 further Q&As across the eight skills (37–38 per skill). The live database now has 801 published questions and 801 unique titles. These cover new concepts, practical uses, pitfalls, and concrete examples. Source and applied SQL: `database/question-batch-300b.mjs` and `database/question-batch-300b.sql`. Supabase migration: `interviewbuddy_second_300_questions_20261110`. The live app was refreshed and verified to show 801 questions; no code deployment was needed.

## Category update — November 11, 2026

Added Node.js & Express, API Design & GraphQL, and DevOps & CI/CD to the live catalog, bringing it to 11 skills. These categories start with no questions. `database/add-categories.sql` is the idempotent update for existing databases; it was applied through Supabase SQL and verified with the anonymous reader role. Fresh databases receive the same categories from the updated seed. The workspace now derives its skill-count subtitle from the loaded catalog; that UI text change takes effect on the next deployment.

## New category Q&As — November 11, 2026

Published 45 Q&As: 15 each for Node.js & Express, API Design & GraphQL, and DevOps & CI/CD. Each category has five Beginner, five Intermediate, and five Advanced entries, all with answers, explanations, and examples. The live library now has 846 published questions with no duplicate titles. Anonymous-role queries verified all 45 complete entries are publicly readable. Source validation and ESLint passed for `database/new-category-questions.mjs`; generated SQL is `database/new-category-questions.sql`. Documentation references and reapplication guidance are in `database/new-category-questions-sources.md`. This content loads at runtime and requires no code deployment.
