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

## Phase 2: academy stories and student works

New videos uploaded through Academy Stories (student and teacher) and the student work upload page use R2. Images and audio still use Cloudinary. National Day uploads belong to a closed event and are unchanged; external video URLs and existing stored media are unchanged.

`/api/media/video` reserves authenticated uploads. A 20 MiB file ceiling, signed size/type, three daily student attempts (ten for teacher), idempotent file retries, bounded HEAD verification, and shared `r2VideoUsage/storage` and daily-byte counters protect the budget. Club and phase-2 uploads share the same 8 GiB lifetime and 200 MiB daily byte ceilings. Failed reservations count conservatively and are not refunded.

Final submission verifies owner, purpose, object size and MIME, and uses the reservation ID as a unique submission document ID. Video URLs stored in Firestore point to the application resolver, never an expiring R2 URL. Public playback requires teacher approval/publication (and unexpired stories); pending files require teacher or owner authentication. The resolver also checks that the recorded object matches its original reservation. DeferredMedia resolves a 30-minute signed URL only when the user clicks play; gallery open/download links resolve it with authentication too.

These are application guardrails, not a provider billing hard cap. Manual uploads and replaying a valid signed URL are outside the counters. Public approved playback is not capped by visitor count. Nothing deletes or migrates old Cloudinary originals. Actual authenticated PUT/HEAD/playback verification remains pending while Firestore's daily free quota is exhausted; local mocked permission/budget tests do not establish production credential validity.
