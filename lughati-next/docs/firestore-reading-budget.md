# Firestore read reductions

The teacher reading-review page now starts with the pending queue, with at most
50 documents from each source per page. “All records” is an explicit paged archive
and uses document cursors, preserving legacy records without `createdAt`. Each
loaded page is sorted locally; the archive does not promise global date order.
Approval/retry updates the displayed row without re-fetching either collection.
Classroom lookups are reused within the screen. Duplicate cleanup requires loading
the whole archive and only deletes real journey document IDs.

The teacher bell uses four count aggregations for pending homework audio,
solutions, daily reading, and unanswered messages. After the bell is opened, the
`updatedAt` threshold preserves the new-notification behavior. These queues rely
on the fields written by current submission/message handlers. Undated or
unnormalized legacy reading records remain available in the review archive.

The weekly reading overview fetches this week's date/timestamp ranges; student
detail pages retain complete history. Activity-based access checks use the recent
15-day window, while the decision itself retains the exact 14-day policy and
manual overrides. The extra day covers the five-minute cache lifetime.

New homework submissions include the server-assigned Riyadh day. Daily legacy
lookups use this day's timestamp ranges. Overlapping identical client reads are
coalesced by signed-in UID; completed snapshots are not cached. The existing
tracking catalog cache now includes UID and Riyadh day.

The account gate retains its live manual-control listener and background focus
checks, but does not re-fetch on every route change. Duplicate focus events are
throttled; manual-control updates bypass this throttle. Expiring manual suspensions
are checked at expiry rather than polled every minute.

## Release order

Deploy the additive indexes before merging/publishing the application:

```sh
cd lughati-next
firebase deploy --only firestore:indexes --project lughati-academy
```

Wait until the new indexes are READY in Firebase:
- `homeworkCompletions`: `studentId/completedAt`, `studentId/createdAt`,
  `readingStatus/updatedAt`, `solutionStatus/updatedAt`.
- `reading-submissions`: `studentId/createdAt`, `status/updatedAt`.
- `studentTeacherMessages`: `teacherReply/updatedAt`.

Only missing-index errors fall back to compatible reads. Activity checks retain
per-student history as a rollout fallback; notification counts fall back to the
relevant pending queue. Network/permission errors are not silently converted to
empty activity. Vercel deployment alone does not publish Firebase indexes.

## Validation

Run `npx tsc --noEmit`, `npm run build`,
`node scripts/test-student-access.cjs`, and
`node --test tests/firestore-reading-budget.test.cjs tests/review-budget.test.cjs tests/notifications-budget.test.cjs tests/recognition-points.test.cjs`.

After publishing, compare executions and read operations for the same traffic/time
window in Query Insights. Verify new homework submission, reading submission,
approval/retry, manual freeze/unfreeze, expiring freezes, and weekly summaries with
real signed-in accounts. Local verification uses mocked Firestore; it does not
measure production read savings or prove that cloud indexes are deployed.
