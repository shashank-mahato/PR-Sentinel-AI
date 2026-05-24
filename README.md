# PR Sentinel AI

AI code reviews before bugs reach production.

PR Sentinel AI is a production-ready SaaS application that connects to a real GitHub App, receives pull request webhooks, reviews changed code with Google Gemini, stores results in Supabase, updates dashboards through Supabase Realtime, and posts professional review comments back to GitHub.

## Features

- Real-time GitHub pull request review through signed webhooks
- Google Gemini code analysis using `gemini-1.5-flash` by default
- Bug, security, performance, reliability, maintainability, and missing-test detection
- Zod-validated structured AI output with one repair attempt
- Backend risk scoring and merge recommendation
- Supabase PostgreSQL persistence with RLS policies
- Supabase Auth with GitHub OAuth
- Supabase Realtime dashboard updates
- GitHub summary comments, inline comments, and grouped fallback comments
- Repository activation toggles and user review preferences
- Vercel-ready Next.js App Router deployment

## Architecture

1. GitHub sends a `pull_request` webhook to `/api/github/webhook`.
2. The route reads the raw body and verifies `X-Hub-Signature-256` with `GITHUB_WEBHOOK_SECRET`.
3. The delivery ID is deduplicated in `webhook_events`.
4. PR metadata and changed files are fetched with a GitHub App installation token.
5. Useful text diffs are filtered, prioritized, and limited by configured review caps.
6. Gemini reviews the diff and returns structured JSON.
7. Zod validates the response and the backend recalculates the risk score.
8. Reviews and findings are saved in Supabase.
9. Dashboard pages update through Supabase Realtime.
10. PR Sentinel AI posts a summary comment and attempts inline comments on GitHub.

## Tech Stack

- Next.js App Router, TypeScript, Tailwind CSS
- shadcn-style UI primitives, Lucide React, Recharts
- Supabase Auth, PostgreSQL, RLS, Realtime
- GitHub App integration with Octokit
- Google Gemini through `@google/generative-ai`
- Zod validation
- Vercel deployment

## Environment Variables

Copy `.env.example` for local development and add the same values in Vercel for production.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_GITHUB_APP_INSTALL_URL=https://github.com/apps/your-github-app-name/installations/new

GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nyour_private_key_here\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

REVIEW_MAX_TOTAL_DIFF_CHARS=60000
REVIEW_MAX_FILES=20
REVIEW_MAX_FINDINGS=30
REVIEW_MAX_INLINE_COMMENTS=10
```

Only `NEXT_PUBLIC_*` values are used in browser code. Gemini, GitHub, and Supabase service-role secrets stay server-side.

## Local Setup

Local development is for validation and iteration. The final webhook flow should use the deployed Vercel URL.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

Open `http://localhost:3000` only for local UI checks.

## Supabase Cloud Setup

1. Create a Supabase Cloud project.
2. Copy the project URL, anon key, and service role key.
3. Add them to Vercel as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Apply migrations from `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_github_installations.sql`
5. Confirm Row Level Security is enabled on:
   - `profiles`
   - `repositories`
   - `pull_request_reviews`
   - `review_findings`
   - `user_settings`
   - `webhook_events`
6. Enable Realtime for:
   - `pull_request_reviews`
   - `review_findings`
   - `repositories`
7. Enable Supabase Auth.
8. Enable the GitHub OAuth provider in Supabase Auth.
9. Set the Supabase Auth site URL to:

```text
https://your-vercel-domain.vercel.app
```

10. Add the redirect URL:

```text
https://your-vercel-domain.vercel.app/auth/callback
```

## GitHub App Setup

Create a GitHub App for production.

Settings:

- Homepage URL: `https://pr-sentinel-ai.vercel.app`
- Webhook URL: `https://pr-sentinel-ai.vercel.app/api/github/webhook`
- Setup URL: `https://pr-sentinel-ai.vercel.app/api/github/install`
- Callback URL if OAuth is used: `https://pr-sentinel-ai.vercel.app/auth/callback`
- Webhook secret: the same value as `GITHUB_WEBHOOK_SECRET` in Vercel

Permissions:

- Metadata: Read-only
- Contents: Read-only
- Pull requests: Read and write
- Issues: Read and write

Subscribe to events:

- Pull request

Generate a private key and add it to Vercel as `GITHUB_APP_PRIVATE_KEY`. The code supports escaped newline format, so this works:

```text
"-----BEGIN RSA PRIVATE KEY-----\nyour_private_key_here\n-----END RSA PRIVATE KEY-----"
```

After creating the app, set:

```bash
NEXT_PUBLIC_GITHUB_APP_INSTALL_URL=https://github.com/apps/your-github-app-name/installations/new
GITHUB_APP_ID=your_github_app_id
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

Sign in to PR Sentinel AI before clicking **Install GitHub App**. GitHub redirects back to `/api/github/install?installation_id=...`, where PR Sentinel AI links that `installation_id` to the logged-in Supabase user in `github_installations` and upserts the accessible repositories with the same `user_id`. Dashboard visibility depends on this mapping, so the install callback must complete successfully.

## Gemini Setup

1. Create a Gemini API key in Google AI Studio.
2. Add `GEMINI_API_KEY` to Vercel.
3. Add `GEMINI_MODEL=gemini-1.5-flash` unless you want to switch models later.

PR Sentinel AI never uses OpenAI variables or OpenAI APIs.

## Deploying to Vercel

1. Push code to GitHub main branch.
2. Open Vercel.
3. Import repository:

```text
https://github.com/shashank-mahato/PR-Sentinel-AI.git
```

4. Select the Next.js framework.
5. Add all required environment variables from `.env.example`.
6. Deploy.
7. Copy the production Vercel URL.
8. Update `NEXT_PUBLIC_APP_URL` in Vercel to:

```text
https://your-vercel-domain.vercel.app
```

9. Update the GitHub App webhook URL to:

```text
https://pr-sentinel-ai.vercel.app/api/github/webhook
```

10. Update the Supabase Auth site URL to:

```text
https://your-vercel-domain.vercel.app
```

11. Add the Supabase redirect URL:

```text
https://your-vercel-domain.vercel.app/auth/callback
```

12. Redeploy after environment changes.
13. Sign in to PR Sentinel AI.
14. Install the GitHub App on a repository.
15. Open a real pull request.
16. Confirm PR Sentinel AI reviews the PR and comments on GitHub.

## Production Webhook Configuration

Use this URL in the GitHub App:

```text
https://pr-sentinel-ai.vercel.app/api/github/webhook
```

The webhook route:

- Requires `X-Hub-Signature-256`
- Uses HMAC SHA-256 and `crypto.timingSafeEqual`
- Deduplicates `X-GitHub-Delivery`
- Processes `opened`, `synchronize`, `reopened`, and `ready_for_review`
- Ignores unsupported actions
- Never logs private keys or webhook secrets

## Testing With a Real Pull Request

Create a branch in a repository where the GitHub App is installed. Add a small vulnerable change such as:

```ts
const password = "admin123";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const user = await db.query("SELECT * FROM users WHERE id = " + id);

  return Response.json(user);
}
```

Open a pull request. Expected findings include:

- Hardcoded secret
- SQL injection
- Missing validation
- Missing error handling

This sample is only for testing a real pull request. It is not used as application data.

## Troubleshooting

- Invalid webhook signature: confirm `GITHUB_WEBHOOK_SECRET` matches the GitHub App webhook secret.
- No repositories visible: sign in first, install the GitHub App, confirm the Setup URL is `https://pr-sentinel-ai.vercel.app/api/github/install`, and make sure `github_installations.installation_id` is linked to your Supabase `auth.users.id`.
- Gemini failures: confirm `GEMINI_API_KEY` and `GEMINI_MODEL` are set in Vercel.
- No dashboard updates: confirm Supabase Realtime is enabled for `pull_request_reviews`, `review_findings`, and `repositories`.
- Inline comments fail: GitHub may reject line numbers outside the current diff. PR Sentinel AI posts a grouped fallback comment.
- Private key errors: preserve newlines or use escaped `\n` in `GITHUB_APP_PRIVATE_KEY`.

## Security Notes

- Service-role Supabase client is server-only.
- GitHub private key, webhook secret, OAuth secret, and Gemini key are never exposed to the browser.
- User-facing data is isolated by Supabase RLS.
- Webhook events are deduplicated by GitHub delivery ID.
- AI output is validated before persistence.
- Dashboard and API routes require authenticated Supabase users.

## Future Improvements

- GitHub Checks API annotations
- Team-level organizations and billing
- Reviewer assignment suggestions
- Per-repository policy profiles
- Background job queue for very large repositories
