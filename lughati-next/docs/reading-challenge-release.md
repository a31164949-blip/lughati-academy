# Reading Challenge restart

This change renames the feature without changing its routes. The default with no
start date is to leave the old challenge accessible under the new label. To start
fresh, build and run the preview and release with
`NEXT_PUBLIC_READING_CHALLENGE_START_DATE=YYYY-MM-DD`. Pick the first new school
reading day in Riyadh, strictly after the last day of readings to exclude
(the boundary is inclusive). Keep the value identical in the build and the
runtime; changing it means a new edition and requires a rebuild.

The challenge then starts at level 1, counts only approved dates from the new
start day, and shows only the new edition's promotion requests. Approval writes
the new edition's level without overwriting the old level. This does not
physically delete old recordings, edit reading history, or change any points,
access rules, or guest permissions. Reads reuse the same documents as before.

Use the currently deployed source as the base and apply only this change to a
separate preview copy; do not replace the live checkout with the GitHub branch.
Use `node scripts/check-reading-challenge.cjs` then
`./node_modules/.bin/next build` on that copy (not `npm run build`, which in
some checkouts also synchronizes Firestore access rules). Before changing live
routing, verify the challenge under a permitted test student account and its
promotion list under the teacher account. Verify that an unread promotion from a
past edition is still in notification history but does not pop up; verify that
a new promotion and unrelated milestones can still be celebrated and unopened
teacher gifts retain priority. Check that reading history and the
existing guest portal are unaffected and keep the current release available for
rollback. No guest changes are included in this release.
