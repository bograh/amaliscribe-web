# AmaliScribe release portal

Public download portal for [AmaliScribe](#about-amaliscribe) — a self-hosted
desktop app for private, local meeting transcription. Visitors get the latest
installer for their OS plus the full release history; CI publishes new releases
over a token-protected API.

**One Next.js app, one origin, no server to keep alive.** The page is a React
Server Component that queries Turso at request time, and the API lives in route
handlers next to it. There is no separate backend process, no client-side fetch
and no loading spinner — the HTML arrives with the releases already in it.

- **Framework** — Next.js 16 App Router, React 19 server components.
- **Storage** — [Turso](https://turso.tech) (libSQL) over HTTP via
  `@libsql/client`.
- **Runtime** — stateless. No local disk, no persistent volume, no Node
  built-ins; deploys as a serverless function and scales to zero.
- **Client JavaScript** — none of our own. There is not a single `'use client'`
  component; even OS detection happens on the server from the `User-Agent`.

## Quick start

```bash
pnpm install
cp .env.example .env.local     # then fill in Turso + CI_RELEASE_TOKEN
pnpm db:migrate                # create the schema (idempotent)
pnpm dev                       # http://localhost:3000
```

Publish a release so the page has something to show:

```bash
curl -X POST "http://localhost:3000/api/releases/latest" \
  -H "Authorization: Bearer $CI_RELEASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d @release.json
```

### Setting up Turso

```bash
turso db create amaliscribe-releases
turso db show amaliscribe-releases --url      # → TURSO_DATABASE_URL
turso db tokens create amaliscribe-releases   # → TURSO_AUTH_TOKEN
pnpm db:migrate
```

For local development you can instead point `TURSO_DATABASE_URL` at
`turso dev --db-file local.db` (`http://127.0.0.1:8080`), or at a plain
`file:data/releases.db` — the client accepts all three, so no code changes.

## Scripts

| Command            | What it does                                    |
| ------------------ | ----------------------------------------------- |
| `pnpm dev`         | Next dev server on :3000                        |
| `pnpm db:migrate`  | Apply the schema to `TURSO_DATABASE_URL`        |
| `pnpm build`       | Production build                                |
| `pnpm start`       | Serve the production build                      |
| `pnpm typecheck`   | `tsc --noEmit`                                  |
| `pnpm test`        | Vitest — `api` (node) and `ui` (jsdom) projects |
| `pnpm test:watch`  | Vitest in watch mode                            |
| `pnpm lint`        | ESLint                                          |

## Environment variables

Next loads `.env.local` (and `.env`) automatically; real environment variables
take precedence, which is what you want in production.

| Variable             | Required | Notes                                                                                                                                                                 |
| -------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TURSO_DATABASE_URL` | yes      | `libsql://…turso.io` in production. Also accepts `http://127.0.0.1:8080` (`turso dev`) or `file:…` for local work. Startup fails loudly if unset.                      |
| `TURSO_AUTH_TOKEN`   | yes\*    | Required for a hosted Turso database; unnecessary for `turso dev` or a local file.                                                                                     |
| `CI_RELEASE_TOKEN`   | yes      | Bearer token CI presents when publishing. **Server-side only.** No `NEXT_PUBLIC_` prefix, so it never reaches the client bundle. Without it, publishing returns `500`. |
| `PORT`               | no       | Read by Next itself; defaults to `3000`.                                                                                                                              |

Generate a token with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API

### `GET /api/releases`

Public. Every release, **newest first** (by publish date, then semver).

```json
{
  "releases": [
    {
      "version": "1.2.3",
      "releaseDate": "2026-08-11T12:00:00.000Z",
      "notes": "Bug fixes and performance improvements.",
      "downloads": {
        "windows": "https://example.com/AmaliScribe-1.2.3-setup.exe",
        "macos": "https://example.com/AmaliScribe-1.2.3.dmg",
        "linux": "https://example.com/AmaliScribe-1.2.3.AppImage"
      }
    }
  ]
}
```

Platforms with no artifact are **omitted** from `downloads`, and the UI hides
those buttons rather than showing a dead link.

The portal's own page does not call this endpoint — the server component queries
SQLite directly. It exists for external consumers and for debugging.

### `GET /api/releases/latest`

Public. `{ "release": … }` for the newest release, or `404` if none exist yet.

### `POST /api/releases/latest`

Protected. Creates or updates one release. **Idempotent by `version`**: posting
a version that already exists replaces it (`200`) instead of creating a
duplicate (`201`).

```
Authorization: Bearer $CI_RELEASE_TOKEN
Content-Type: application/json
```

```json
{
  "version": "1.2.3",
  "releaseDate": "2026-08-11T12:00:00Z",
  "notes": "Bug fixes and performance improvements.",
  "downloads": {
    "windows": "https://example.com/AmaliScribe-1.2.3-setup.exe",
    "macos": "https://example.com/AmaliScribe-1.2.3.dmg",
    "linux": "https://example.com/AmaliScribe-1.2.3.AppImage"
  }
}
```

Validation rules:

- `version` — required, semver (`1.2.3`, `2.0.0-beta.1`).
- `releaseDate` — required, any parseable ISO 8601 timestamp; stored as UTC.
- `notes` — optional string (max 20 000 chars). Absent, `null` or `""` all
  become "no notes", and the UI says so explicitly.
- `downloads` — required object with at least one of `windows`, `macos`,
  `linux`. Each value must be an absolute `http(s)` URL pointing directly at the
  installer artifact. Unknown platform keys are rejected.

A re-publish replaces the whole `downloads` map, so omitting a platform on a
re-publish removes that download.

Responses:

| Status | Body                                                 | When                                        |
| ------ | ---------------------------------------------------- | ------------------------------------------- |
| `201`  | `{ "created": true, "release": … }`                  | New version stored                          |
| `200`  | `{ "created": false, "release": … }`                 | Existing version updated in place           |
| `400`  | `{ "error": "validation_failed", "details": [...] }` | Bad payload — every problem listed at once  |
| `400`  | `{ "error": "invalid_json" }`                        | Body is not parseable JSON                  |
| `401`  | `{ "error": "unauthorized" }`                        | Missing, malformed or wrong bearer token    |
| `413`  | `{ "error": "payload_too_large" }`                   | Body over 64 KB                             |
| `500`  | `{ "error": "server_misconfigured" }`                | `CI_RELEASE_TOKEN` is not set on the server |

Tokens are compared with `crypto.timingSafeEqual`, and authorization runs
*before* the body is read, so an unauthenticated request is never parsed.

## CI publishing flow

1. The release pipeline builds Windows, macOS and Linux installers.
2. It uploads them somewhere publicly downloadable (GitHub release assets, S3,
   your own artifact host). **The portal stores URLs, not files**, so links
   always point straight at the CI-produced artifact.
3. On success it POSTs the release, using a `CI_RELEASE_TOKEN` secret:

```bash
curl -X POST "$APP_URL/api/releases/latest" \
  -H "Authorization: Bearer $CI_RELEASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d [release.json](release.json)
```

> With curl, read the body from a file with `-d @release.json` (note the `@`).

Because the endpoint is idempotent, re-running a failed pipeline is safe, and
re-publishing a version after fixing one platform's build just updates that
release. `.github/workflows/publish-release.example.yml` is a working starting
point.

## Deploying

Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` and `CI_RELEASE_TOKEN` in the host's
environment, run `pnpm db:migrate` once against that database, and deploy.

```bash
pnpm install
pnpm db:migrate     # once per environment, and after any schema change
pnpm build
pnpm start          # or let Vercel/Netlify/Cloudflare run the build output
```

The app is **stateless**: no local disk, no persistent volume, no native
modules, and nothing to keep warm. The libSQL client is plain JavaScript over
HTTP, so instances can scale to zero and cold-start freely — a serverless
function per request is the expected shape, not a compromise.

On runtimes: the routes use the default `nodejs` runtime, which deploys as
serverless functions. The code holds no Node built-ins — token comparison uses
`TextEncoder` rather than `node:crypto`, and nothing touches `fs` — so adding
`export const runtime = 'edge'` to `app/page.tsx` and the two route files builds
and runs unchanged. That is verified, but left off by default because **Next 16
deprecates the edge runtime** in favour of `nodejs` ("The Edge Runtime is
deprecated" at build time). Enable it only if a specific target requires it.

Migrations are deliberately *not* run per request, so no invocation pays for a
schema round-trip. Wire `pnpm db:migrate` into a deploy hook if you want it
automated — it is idempotent.

## Tests

```bash
pnpm test
```

Two Vitest projects, 65 tests. They run offline against an in-memory libSQL
database (`createClient({ url: ':memory:' })`) — the same client API and SQL
dialect as Turso, without the network.

- **api** (`lib/__tests__/`) — the handlers are written against web
  `Request`/`Response`, so they are called directly with no server running.
  Covers authorization (missing, wrong, prefix-of-real, wrong scheme,
  unconfigured server, `WWW-Authenticate`), payload validation, oversized
  bodies, upsert idempotency, newest-first ordering including the `1.10.0` vs
  `1.9.0` tie-break, and `User-Agent` platform detection. `routes.test.ts`
  additionally imports the **real route modules**, covering the env-var and
  store wiring plus the 500 path when the database is unreachable.
- **ui** (`components/`) — Testing Library over the server components. Covers the
  featured latest release, promoting the detected OS, *not* promoting a platform
  the release has no build for, hiding links for missing artifacts, notes
  rendering, history ordering, the single-release and empty states, and
  landmarks/skip link.

## Project layout

```
app/
  layout.tsx                      Document shell and metadata
  page.tsx                        Server component: reads SQLite, sniffs UA
  globals.css                     Design tokens and all styling
  api/releases/route.ts           GET  /api/releases
  api/releases/latest/route.ts    GET + POST /api/releases/latest
components/
  ReleasePortal.tsx               Whole-page composition (pure, testable)
  LatestRelease.tsx               Featured release card
  ReleaseCard.tsx                 History entry
  DownloadList.tsx                One row per available platform
  DownloadLink.tsx                A single artifact link
  icons.tsx                       Inline currentColor icons
lib/
  api.ts                          Request handlers (Request → Response)
  store.ts                        Memoised repository handle
  releases.ts                     ReleaseRepository — all persistence, async
  db.ts                           libSQL client factory + schema
  validation.ts                   Payload validation + semver sort keys
  release.ts                      Shared types
  platform.ts, format.ts          UA detection, filenames, dates
scripts/
  migrate.ts                      pnpm db:migrate
```

The route handlers are three lines each because the logic lives in `lib/api.ts`
and takes its repository as an argument — that is what makes the tests fast and
the storage layer swappable.

## Extending

- **Release channels** — add a `channel` column (default `'stable'`), accept an
  optional `channel` in the payload, make the primary key `(version, channel)`,
  and filter in `ReleaseRepository.list()`.
- **Checksums / signatures** — add `*_sha256` columns alongside each platform
  URL and surface them under each download row.
- **Auto-update metadata** — add `app/api/updates/[platform]/route.ts` reading
  the same table; `ReleaseRepository.latest()` is already there.

The schema lives in one place (`SCHEMA` in `lib/db.ts`), so adding a column is
one statement plus a `pnpm db:migrate`. If the schema starts changing often,
promote `SCHEMA` to a numbered list of migrations with a `schema_version` table —
the script is already the single place that would need to loop over them.

## Design and accessibility notes

The visual language is warm paper, deep-forest blocks and a single lime accent:
rounded cards, a centred hero with a marker-pen underline, a dark "how it works"
block, a stats band and a dark CTA/footer.

- Semantic landmarks, a skip link, and labelled sections; the release history is
  a real list of `article`s with headings.
- Download links carry explicit `aria-label`s naming the app, version, platform
  and filename, since the visible text is deliberately terse.
- Body text clears WCAG AA on every surface. Lime is only ever used on forest,
  and forest ink only on lime or paper.
- `prefers-reduced-motion` disables transitions and smooth scrolling.
- OS detection is server-side and best-effort; it only reorders and highlights.
  Every platform with an artifact is always listed, and mobile visitors — who
  have no desktop build — simply see the full list.

## About AmaliScribe

AmaliScribe is a self-hosted desktop application for private meeting
transcription and summarisation, built as an Electron + React app backed by a
native Go sidecar that captures audio and runs local `whisper.cpp`
speech-to-text inference. Audio and transcripts stay on the user's machine
instead of going to a cloud service. This repository is only the public download
portal for its releases.
