# EduSpace Production Deployment Runbook

This runbook defines the approved release, verification, and rollback process.
It complements `DEPLOYMENT.md` and must be followed for every production change.

## Branch and platform rules

- `PROD` is the integration and preview branch.
- `main` is the only production branch.
- Vercel Project Settings → Git → Production Branch must be `main`.
- Vercel previews remain enabled for `PROD`.
- Render is pinned to `main` in `render.yaml`.
- Render auto-deploy mode is `checksPass`, so a backend image is built only
  after the GitHub CI checks for `main` pass.
- Never push an untested feature directly to `main`.

## Standard release procedure

1. Fetch `origin` and confirm the working tree is clean.
2. Confirm `origin/main` is an ancestor of `origin/PROD`.
3. Confirm the latest `PROD` CI run succeeded.
4. Review the Vercel `PROD` preview.
5. Fast-forward `main` to `PROD`; never force-push either branch.
6. Confirm the `main` CI run succeeds.
7. Wait for Vercel and Render to deploy the same commit.
8. Run the **Production Smoke** workflow manually with the expected commit SHA.
9. Complete the authenticated checklist below.
10. Record the result in `docs/IMPROVEMENT_ROADMAP.md`.

## Automated public smoke checks

The workflow `.github/workflows/production-smoke.yml` runs daily and can be run
manually after every release. It verifies:

- The production frontend responds successfully.
- `/api/version` reports the expected Git SHA and API schema.
- Render `/health` reports the same Git SHA and API schema.
- Database connectivity is healthy.
- Profile storage connectivity is healthy.
- Document storage connectivity is healthy.

For a manual run, open GitHub Actions → Production Smoke → Run workflow. Supply
the full production SHA when verifying a specific deployment.

## Authenticated production smoke checklist

Use dedicated test accounts and remove test data afterward.

- `[ ]` Admin login and logout work.
- `[ ]` Dashboard counts and recent activity load.
- `[ ]` A pending teacher/manager is blocked from login.
- `[ ]` Admin approval assigns the requested role.
- `[ ]` Approved staff can log in with matching permissions.
- `[ ]` Rejection revokes staff sessions and permissions.
- `[ ]` Create and remove one test room or equipment item.
- `[ ]` Submit and review one test reservation.
- `[ ]` Upload, display, replace, and delete a profile picture.
- `[ ]` Upload and download one private test document.
- `[ ]` Password-reset email completes successfully.
- `[ ]` French, English, Arabic, RTL, mobile, and dark mode render correctly.
- `[ ]` Dashboard → System Status reports compatibility and healthy dependencies.

## Frontend rollback (Vercel)

1. Open the Vercel project → Deployments.
2. Select the most recent known-good production deployment.
3. Use **Promote to Production**.
4. Verify `/api/version` now reports the promoted frontend SHA.
5. If the frontend expects an older API schema, roll back Render to the matching
   compatible backend or immediately redeploy the previous matching Git commit.
6. Run Production Smoke with the expected rollback SHA.

## Backend rollback (Render)

1. Open the Render service → Events/Deploys.
2. Select the most recent known-good deploy.
3. Use **Rollback** or manually deploy the known-good commit.
4. Verify `/health` reports the expected SHA and healthy dependencies.
5. Promote the matching Vercel deployment if frontend/API compatibility differs.
6. Run Production Smoke with the expected rollback SHA.

## Database rollback policy

- Do **not** run `migrate:rollback` during a routine application rollback.
- Production migrations must remain backward-compatible for at least one release.
- Roll back application code first while leaving additive columns/tables intact.
- Destructive schema changes require a separate reviewed cleanup release after
  backups and restore testing.
- If a migration corrupts or removes data, stop writes and restore from a tested
  backup instead of improvising SQL in production.

## Emergency response

1. Record the failing frontend SHA, API SHA, timestamp, and user-visible error.
2. Check GitHub CI, Vercel deployment, Render deploy logs, and `/health`.
3. If versions differ, restore the most recent matching pair.
4. If a dependency is degraded, avoid repeated deploys and investigate the
   database/storage provider first.
5. Confirm recovery with Production Smoke and the authenticated checklist.
6. Document the incident and add a regression test before the next release.
