---
name: publish-github-pages
description: Safely publish approved changes from this travel-planner repository to its existing GitHub Pages production site and verify the live result. Use when the user asks to publish, deploy, push live, release, or update anything at https://noakrams.github.io/travel-planner/, including the React app or legacy Japan pages.
---

# Publish GitHub Pages

Publish only the intended changes, run the repository's verification pipeline, trigger the manual Pages workflow, and prove the requested content is live.

## Production contract

- Expect repository remote `https://github.com/noakrams/travel-planner.git`.
- Expect deployment branch `main` and public root `https://noakrams.github.io/travel-planner/`.
- Expect workflow `.github/workflows/deploy-pages.yml`, triggered only with `workflow_dispatch`.
- Expect public GitHub variables `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL`. Never place database passwords, connection strings, Auth secrets, or private tokens in Vite or GitHub variables.
- Preserve `japan/japan-2026.html`, `japan/japan-2026-he.html`, and `japan/kyoto-plan-2026.html` unless the user explicitly asks to change them.
- Stop and report a mismatch in the remote, branch, workflow, or public URL before publishing.

## Authorization boundary

- Treat an explicit request to publish, deploy, push live, or release the specified changes as authorization to stage those changes, commit them, push `main`, and run the existing Pages workflow.
- Do not publish when the user asks only to prepare, review, test, or explain. Ask for explicit production approval after summarizing what will go live.
- Never broaden approval to unrelated dirty-worktree changes.

## Publish workflow

1. Read `AGENTS.md`. Inspect `git status --short --branch`, the current branch, `origin`, the relevant diff, and the latest commit.
2. Identify the exact files belonging to the requested change. Preserve all unrelated modified, deleted, and untracked files.
3. Run `git diff --check` for the intended files and the relevant local checks. For app changes, run lint, type-check, unit tests, and a production build. Run browser tests when the change affects UI behavior or layout.
4. Do not hide a validation failure. If lint discovers only files inside an unrelated local `.worktrees` checkout, do not edit that checkout; isolate the repository validation and rely on the clean GitHub runner to repeat the full pipeline.
5. Confirm GitHub Actions has both public Neon endpoint variables and no obsolete Supabase deployment variables when database client configuration is in scope.
6. Stage only explicit paths; never use `git add .` or `git add -A` in a dirty worktree. Review `git diff --cached --check`, `git diff --cached --stat`, and the staged diff.
7. Commit with a concise description, then push the current `main` branch with `git push origin main`. Never force-push or rewrite history.
8. Trigger `gh workflow run deploy-pages.yml --repo noakrams/travel-planner --ref main` and retain the run URL.
9. Monitor the workflow to completion with `gh run watch <run-id> --repo noakrams/travel-planner --exit-status`. Treat any failed install, lint, type-check, test, build, upload, or deploy step as an incomplete release.
10. Verify the exact public URL returns HTTP 200. Download the live HTML and confirm a unique marker or asset from the new deployment. Do not infer success from the push or workflow alone.
11. When app infrastructure or data-provider code changes, inspect the delivered bundles for the expected Neon marker/endpoints and confirm the former provider URL is absent.
12. Confirm all three legacy Japan HTML URLs still return HTTP 200 after an app deployment.

## Live verification

Use bounded requests and temporary files:

```sh
curl -fsSI --max-time 20 "https://noakrams.github.io/travel-planner/"
curl -fsSL --max-time 30 -o /tmp/travel-planner-live.html "https://noakrams.github.io/travel-planner/"
rg -n "<unique-live-marker>" /tmp/travel-planner-live.html
```

Parse the deployed asset names from the live HTML instead of assuming locally generated hashes. A successful response without the requested marker is not verified; retry for a short bounded period because Pages and CDN caches can lag.

## Guardrails and report

- Never reset, clean, discard, or publish unrelated user work.
- Never delete production data, Neon branches, GitHub environments, Pages history, or the repository as part of publishing.
- If authentication blocks a required Git or GitHub operation, request only the narrow authorization needed.
- Report the public URL, full commit identifier, workflow URL/result, checks performed, and live markers verified.
- If the response has `cache-control: max-age=600`, tell the user to hard-refresh or allow up to ten minutes for cached content to expire.
