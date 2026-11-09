# Cloudflare deployment — preflight only

This branch prepares OpenNext for a Next.js 16 app, but **has not been built or deployed**.

## Safety requirements
- Never run the old `npm run build` from main: it mutates Firebase access rules. This branch inherits the safe build-script change from PR #110.
- Install and lock compatible versions of `@opennextjs/cloudflare` and `wrangler` in package-lock.json, then validate `npm ci`, `npx tsc --noEmit`, `npm run build`, and `npx opennextjs-cloudflare build` before deploying.
- Confirm Node.js 20+ or supported newer version, Worker bundle limits, Firebase Admin and AWS S3 SDK compatibility, environment secrets, and all student auth/teacher-only routes.
- Never copy Firebase service account credentials into GitHub. Configure secrets in Cloudflare securely.
- Check OpenNext behavior with Firestore caching, uploads, R2 or image routes; preserve all student records.
- Deploy only to an isolated preview after review, not to the student-facing production domain.

## Once tests pass
Cloudflare repository path: `lughati-next`.
Build command: `npx opennextjs-cloudflare build`.
Deploy command: `npx wrangler deploy`.
Do not deploy with this configuration until the dependency lockfile and compatibility tests are complete.
