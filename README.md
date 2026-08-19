# Roam travel planner

Roam is a Vite + React + TypeScript PWA for private trip planning and unlisted read-only sharing. It uses a Dexie replica and mutation outbox so previously opened trips remain readable and editable offline. Neon Postgres is the permanent source of truth when its public Auth and Data API endpoints are configured.

The legacy Japan pages remain untouched in `japan/` and continue to be the rollback path.

## Local development

Requirements: Node 22+ (the project was verified with Node 25.6.1) and npm 11+.

```sh
npm install
npm run dev
```

The configured production base is `/travel-planner/` and all application routes use a hash, so GitHub Pages deep links do not require rewrites.

## Neon setup

The app works in local mode without endpoints. To enable owner authentication, cloud synchronization, and sharing:

1. Create a Neon project and provision Neon Auth and the Neon Data API.
2. Apply the schema migrations to the project's production branch.
3. Configure Google in Neon Auth and add the Neon Auth callback URL to Google's authorized redirect URIs.
4. Add `https://noakrams.github.io/travel-planner/?auth=callback` and `http://localhost:5173/?auth=callback` to the Neon Auth redirect allowlist.
5. Sign in once with the Google account that will own the app.
6. In the Neon SQL editor, add that user's UUID to the owner allowlist and create the profile if those rows do not already exist, replacing the UUID and name:

   ```sql
   insert into public.app_owners(user_id) values ('YOUR-AUTH-USER-UUID');
   insert into public.profiles(id, display_name) values ('YOUR-AUTH-USER-UUID', 'Your name');
   ```

7. Copy `.env.example` to `.env.local` and add only the public Neon Auth and Data API URLs.

The Google button authenticates an account; it does not grant edit access by itself. Database row-level security requires the signed-in user to be either the owner in `public.app_owners` or an approved verified editor. Approved editor emails are normalized and stored only as SHA-256 hashes in the private `private.app_editors` table. Neon Auth browser sessions persist, so an approved user stays signed in on that browser/device until signing out, clearing site data, or a configured session limit expires.

Visitors do not need to sign in. The `#/share/...` itinerary is always read-only and hides editor controls. Owners can create and duplicate trips; approved editors can edit existing trips but cannot create, duplicate, delete, or take ownership of a trip. Keep only Noa Krams's Auth user UUID in `public.app_owners`.

Never put a service-role key, Management API token, database password, or GitHub credential in a Vite variable or committed file.

Existing itinerary images use external URLs. Direct object uploads are intentionally disabled until Neon Object Storage is configured; do not store sensitive personal photos at public URLs.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Publishing safety

Do not replace the live Pages entry point until local checks pass and the owner explicitly approves publishing. The checked-in workflow is deliberately manual-only (`workflow_dispatch`) and has not been run.

When publishing is approved:

1. Add `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL` as GitHub Actions repository variables (they are public client endpoints, never service credentials).
2. Preserve unrelated work, stage only the intended app files, review the staged diff, commit, and push `main`.
3. In repository Pages settings, choose **GitHub Actions** as the source.
4. Manually run **Deploy travel planner to GitHub Pages**. It repeats linting, type checks, unit tests, and the production build before deployment.
5. Verify the root app, an offline reload, and a unique content marker at `https://noakrams.github.io/travel-planner/`. Also verify all three legacy files under `/travel-planner/japan/`; the build copies them byte-for-byte into `dist/japan/`.

Rollback is a manual deployment of the last known-good commit. Do not delete the source files under `japan/`.

## Security note

As of 6 August 2026, npm reports an advisory in React Router's RSC/server-action mode for the current 7.18.2 release. Roam is a client-only `HashRouter` SPA and does not include RSC, SSR, server actions, or action endpoints, so the vulnerable code path is not used. Older releases carry additional redirect, matching, and SSR advisories and were not selected.
