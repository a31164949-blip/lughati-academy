# Cloudflare deployment — preflight only

This branch prepares OpenNext for a Next.js 16 app, but **has not been built or deployed**.

## Safety requirements
- Never run the old `npm run build` from main: it mutates Firebase access rules. This branch inherits the safe build-script change from PR #110.
- Install and lock compatible versions of `@opennextjs/cloudflare` and `wrangler` in package-lock.json, then validate `npm ci`, `npx tsc --noEmit`, `npm run build`, and `npx opennextjs-cloudflare build` before deploying.
- Confirm Node.js 20+ or supported newer version, Worker bundle limits, Firebase Admin and AWS S3 SDK compatibility, environment secrets, and all student auth/teacher-only routes.
- Never copy Firebase service account credentials into GitHub. Configure secrets in Cloudflare securely.
- Check OpenNext behavior with Firestore caching, uploads, R2 or image routes; preserve all student records.
- Deploy only to an isolated preview after review, not to the student-facing production domain.

Run `node scripts/check-cloudflare-readiness.cjs` first. It intentionally fails until both OpenNext and Wrangler are added to the package manifest and lockfile. Passing this static check does **not** mean the application is safe to deploy.\n\n## Once tests pass
Cloudflare repository path: `lughati-next`.
Build command: `npx opennextjs-cloudflare build`.
Deploy command: `npx wrangler deploy`.
Do not deploy with this configuration until the dependency lockfile and compatibility tests are complete.

## Verified source-level compatibility risk (2026-11-10)

- `firebase-admin.ts` initializes `firebase-admin/app` with a service-account certificate and uses `firebase-admin/auth` and `firebase-admin/firestore`.
- `app/api/student-access/route.ts` explicitly declares `runtime = "nodejs"`, verifies Firebase ID tokens, reads student documents and updates access controls through the Admin SDK.
- Cloudflare's `nodejs_compat` flag is **not proof** that Firebase Admin's underlying Firestore transport and Node-specific dependencies will work in Workers. Test these routes on a non-production Worker with test credentials and test students, or design a secure supported alternative. Do not relax Firestore rules to work around a failed Admin SDK.
- The GitHub Actions workflow has been committed but no successful build or test run has been verified. The dependency lockfile is still missing the Cloudflare packages as of this review.
- Protect the teacher-only access-control POST route and verify student/teacher isolation before any production release.

## Free-only fallback approved (2026-11-10)

GitHub Actions could not start because the GitHub account is locked due to a billing issue; this is not a build failure. Do not retry repeatedly or enable paid Actions.

Use a free local development environment to generate and validate the lockfile and Worker bundle, or Cloudflare's included build pipeline **only after** dependency and runtime compatibility are reviewed. Never assume Cloudflare's free plan can support this app without checking CPU, memory and request limits.

Suggested local commands (Node.js 22, from `lughati-next`):

```sh
npm install --save-dev @opennextjs/cloudflare wrangler
npm run cloudflare:preflight
npx tsc --noEmit
npx opennextjs-cloudflare build
```

Commit both `package.json` and `package-lock.json` to this branch. Do **not** deploy until Firebase Admin routes have been verified on an isolated test environment. Do not put service-account secrets in GitHub or command logs. Cloudflare Workers deployment may require a different Firebase Admin architecture; a successful build alone is insufficient.
