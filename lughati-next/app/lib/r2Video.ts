import "server-only";
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
export const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};

function configuration() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) throw new Error("R2_NOT_CONFIGURED");
  return { bucket, client: new S3Client({
    region: "auto", forcePathStyle: true, endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
    maxAttempts: 1,
  }) };
}

export async function videoUploadUrl(key: string, size: number, contentType: string) {
  const { client, bucket } = configuration();
  return getSignedUrl(client, new PutObjectCommand({
    Bucket: bucket, Key: key, ContentType: contentType, ContentLength: size,
  }), { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) });
}

export async function verifyVideoObject(key: string, size: number, contentType: string) {
  const { client, bucket } = configuration();
  const object = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  if (object.ContentLength !== size || object.ContentType !== contentType) throw new Error("VIDEO_MISMATCH");
}

export async function videoPlaybackUrl(key: string) {
  const { client, bucket } = configuration();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket, Key: key, ResponseContentDisposition: "inline",
  }), { expiresIn: 1800 });
}
