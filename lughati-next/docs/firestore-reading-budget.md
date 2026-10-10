# Firestore read reductions

The teacher reading-review page now starts with the pending queue, with at most
50 documents from each source per page. “All records” is an explicit paged archive
and uses document cursors, preserving legacy records without `createdAt`. Each
loaded page is sorted locally; the archive does not promise global date order.
Approval/retry updates the displayed row without re-fetching either collection.
Classroom lookups are reused within the screen. Duplicate cleanup requires loading
the whole archive and only deletes real journey document IDs.

The teacher bell and all automatic counter queries have been removed. A static
link keeps the notification center accessible; its requests run only when opened.

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
  both used for bounded activity and legacy daily lookups.
- `reading-submissions`: `studentId/createdAt`.

Only missing-index errors fall back to compatible reads. Activity checks retain
per-student history as a rollout fallback. Network/permission errors are not silently converted to
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

## Shared content and archive reads (second release)

- The Next data cache shares public announcements, academy board, published weekly plan, class diary, heroes and gallery highlights across visitors for up to five minutes. Private/student data is excluded from these public responses. Successful teacher publication/edit/delete invalidates the public cache; failed invalidation falls back to the TTL. Direct Firebase console edits also use the TTL.
- Class diary archive uses 20 published records per page, preserving its createdAt ordering. The latest diary card reads only one record. Gallery scans no more than 30 source records per collection per page, retains legacy approval/publication spellings and filters non-public records before returning them. Even an empty visible page can offer the next page when its scanned records were unpublished. Gallery cursors retain full timestamp precision, with document IDs as tie breakers; finished collections are skipped.
- Parent quiz results use 20 records per page with snapshot cursors. Their existing implicit document-ID order is preserved; the button is “more results,” not a claim of global chronological order.
- The journey notification inbox loads when opened, including point gifts and milestone notices. Messages remain available, and the unread count comes from the existing journey response instead of a second 30-document query. The quiz/parent material notices remain automatic so targeted teacher materials remain visible.
- Five game scoreboard listeners detach when hidden and resume when visible. Student manual-access security listener stays live. Live lessons retain one-minute updates while visible, without a hidden polling timer or overlapping requests.
- Weekly recognition still uses its existing persisted once-per-week summary and excludes gifted/old points. Ready summary reads now share a one-hour data cache; anonymous teacherPreview requests cannot start an out-of-window ranking calculation. The recognition policy and weekly snapshot are unchanged.

Validation: production build, pagination/privacy/invalidation/subscription tests, existing notification and recognition tests. No additional Firestore indexes required. Production savings need a new usage window; these changes do not reset exhausted daily quotas.
