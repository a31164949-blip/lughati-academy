# Storage budget controls

## New uploads

All existing client Cloudinary upload entry points now use `app/lib/uploadCloudinary.ts`.
JPEG/PNG/WebP originals are prepared on the device before upload: longest edge at most
2000 pixels, no upscaling, quality 0.9 for JPEG/WebP, alpha-preserving PNG/WebP output,
and no replacement when the new file would be larger. Already-small images (350 KiB
and within dimensions) are untouched. Raster files over 30 MiB are rejected. Other
formats, animated GIF, SVG, PDF, audio and video are not recompressed by this helper.
The existing R2 video compressor and routing remain separate.

Successful unsigned uploads can be reused for the same File object, endpoint and
form parameters for 30 minutes in the current page session. This covers concurrent
clicks and a retry after a database-save failure. It is not a cross-session or
content-hash deduplication system. Errors are not cached. Signed uploads bypass
reuse. Resource URLs and upload responses are never saved in localStorage.

Existing gallery approval already publishes the existing file URL, without uploading
another copy. Image delivery widths are restricted to the existing 160, 420, 900,
1000 and 1200 pixel sizes, preserving current delivery URLs instead of creating
new variants for existing callers. Original upload URLs are still stored in records.

## Teacher review

`/teacher/storage-review` is linked from the teacher dashboard. The authenticated
POST API authenticates every request before using cached results (five minutes).
No inventory request runs automatically when the page opens.

- Cloudinary: one metadata Search call per page, max 50 original assets, sorted by
  bytes descending. Same resource type/bytes/etag within a page is marked only as
  potential duplication. Files have not been proven unreferenced. No media is downloaded.
- R2: one ListObjectsV2 call per page, `media/` prefix, max 50. Results are size-sorted
  only within that page. This is not a global largest-file ranking.
- Retention: three equality queries for rejected studentWorks, academyStories and
  notebookNominations, at most 25 records each. Excludes published work and records
  rejected less than 30 days ago, using rejection/review time before upload time.
  This is a bounded sample, not a complete retention audit.

Listed bytes describe original files, not derived assets, backups or a guaranteed
amount of reclaimable storage. No delete API, schedule, TTL, storage-class change
or R2 lifecycle rule is introduced here. Cloudinary inventory requires server-only
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET. Missing keys
stop the inventory without Firestore audit reads.

Old notebook deletion remains the separately implemented teacher-confirmed flow.
A rejected record is only a review candidate; its file may still be shared elsewhere.
Training recordings should be reviewed at the end of term while retaining learning
results and noteworthy work; no term-end date or automatic deletion is configured.

## Validation and limits

Node VM tests cover compression dimensions, format choice, cleanup, retry isolation,
failed uploads, authenticated inventories, query bounds and metadata-only R2 listing.
They mock canvas/provider behavior: they do not verify text legibility or Safari's
encoder. A teacher should upload a photographed notebook page on their iPad and
inspect readability. Live provider inventory and real deletion require account
configuration/authentication and are not performed in mocked tests.
