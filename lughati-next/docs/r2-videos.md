# R2 video rollout — club challenges

The first rollout moves new club challenge videos to private R2 objects. Images,
audio, existing Cloudinary submissions, and video uploads in other sections stay
on their current paths until the club upload/playback flow is confirmed in production.

Production server variables: `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`,
`R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`. Never use `NEXT_PUBLIC_` names.
The bucket must allow the production origin, GET/HEAD/PUT, and Content-Type/Range.
R2 credentials are intentionally absent from Preview.

Limits: 20 MiB per video; three upload authorizations per student per Riyadh day;
200 MiB of new reservations per day; 8 GiB of lifetime reserved storage.
Reservations include failed uploads and never automatically refund storage.
Retries reuse the same key and size. The signed PUT lasts five minutes and signs
Content-Length and Content-Type. SDK retries are disabled. Five bounded HEAD
checks validate the reserved size/type before saving a submission. Expiring GET
URLs are generated only on demand; Firestore stores object keys, never expiring URLs.
Playback links last 30 minutes, and new playback authorizations are limited to
30/day for an owner and 200/day for a teacher. A bearer playback link is usable
by anyone holding it until expiry.

These are application guardrails, not a Cloudflare billing cap. Manual uploads,
other applications, and replay of valid signed URLs are outside these counters.
Do not reset usage counters without reconciling actual bucket contents.

Validation: `node --test tests/r2-videos.test.cjs`, TypeScript, changed-file ESLint,
and `npm run build`. Tests use fake credentials and do not upload paid media.
Production acceptance still needs one small valid MP4 submitted by a current
club member, then opened by the teacher; verify one object and expected CORS.
Do not approve the sample for points unless it is a real challenge submission.
