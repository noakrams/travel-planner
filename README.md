# Roam travel planner

Roam is a Vite + React + TypeScript PWA for private trip planning and unlisted read-only sharing. It uses a Dexie replica and mutation outbox so previously opened trips remain readable and editable offline. Supabase becomes the permanent source of truth when public project credentials are configured.

The legacy Japan pages remain untouched in `japan/` and continue to be the rollback path.

## Local development

Requirements: Node 22+ (the project was verified with Node 25.6.1) and npm 11+.

```sh
npm install
npm run dev
```

The configured production base is `/travel-planner/` and all application routes use a hash, so GitHub Pages deep links do not require rewrites.

## Supabase setup

The app works in local mode without credentials. To enable owner authentication, cloud synchronization, storage, and sharing:

1. Create a Supabase project.
2. Apply `supabase/migrations/20260806180000_initial_schema.sql` with the Supabase CLI or SQL editor.
3. Enable Google under **Authentication → Sign In / Providers** in Supabase. Create a Google OAuth web client, add the Supabase callback URL shown on that provider page to Google's authorized redirect URIs, then paste the Google client ID and secret into Supabase.
4. Under **Authentication → URL Configuration**, set the production site URL and add both production and local auth callback URLs to the redirect allowlist. For this app they are `https://noakrams.github.io/travel-planner/#/auth/callback` and `http://localhost:5173/#/auth/callback`.
5. Sign in once with the Google account that will own the app. If its verified email matches the existing magic-link user, Supabase automatically links Google to that same user.
6. In the Supabase SQL editor, add that user's UUID to the owner allowlist and create the profile if those rows do not already exist, replacing the UUID and name:

   ```sql
   insert into public.app_owners(user_id) values ('YOUR-AUTH-USER-UUID');
   insert into public.profiles(id, display_name) values ('YOUR-AUTH-USER-UUID', 'Your name');
   ```

7. Copy `.env.example` to `.env.local` and add only the public project URL and anon key.

The Google button authenticates an account; it does not grant edit access by itself. Database row-level security still requires the signed-in user's UUID to be present in `public.app_owners`, so other Google accounts cannot read or change owner data. Supabase browser sessions persist by default, so the owner stays signed in on that browser/device until signing out, clearing site data, or a configured session limit expires.

Visitors do not need to sign in. The public itinerary stays readable, while edit, create, duplicate, import, and settings controls are enabled only after the current Google user passes the `public.is_app_owner()` database check. Keep only Noa Krams's Auth user UUID in `public.app_owners`.

Never put a service-role key, Management API token, database password, or GitHub credential in a Vite variable or committed file.

The `trip-media` bucket is public for non-sensitive destination imagery with unguessable paths. Change it to private and add signed-URL delivery before storing sensitive personal photos.

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

1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions repository variables (they are public client configuration, never service credentials).
2. Preserve unrelated work, stage only the intended app files, review the staged diff, commit, and push `main`.
3. In repository Pages settings, choose **GitHub Actions** as the source.
4. Manually run **Deploy travel planner to GitHub Pages**. It repeats linting, type checks, unit tests, and the production build before deployment.
5. Verify the root app, an offline reload, and a unique content marker at `https://noakrams.github.io/travel-planner/`. Also verify all three legacy files under `/travel-planner/japan/`; the build copies them byte-for-byte into `dist/japan/`.

Rollback is a manual deployment of the last known-good commit. Do not delete the source files under `japan/`.

## Security note

As of 6 August 2026, npm reports an advisory in React Router's RSC/server-action mode for the current 7.18.2 release. Roam is a client-only `HashRouter` SPA and does not include RSC, SSR, server actions, or action endpoints, so the vulnerable code path is not used. Older releases carry additional redirect, matching, and SSR advisories and were not selected.
