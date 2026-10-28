import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { requireAuth, wrap, type AuthedRequest } from "../auth";
import { env } from "../env";

const router = Router();

const schema = z.object({
  contentType: z.string().regex(/^image\/(png|jpe?g|webp|gif)$/),
});

// Photos are private: the bucket blocks public access, and the API hands out links that expire
// after an hour (photoLink). The app strips location and camera details (EXIF) before uploading.
const bucketUrl = () => `https://${env.s3Bucket}.s3.${env.awsRegion}.amazonaws.com/`;

/** The S3 key of a photo NoBucks stored, or null for anything else (an outside address). */
export function ownPhotoKey(stored: string | null | undefined): string | null {
  if (!stored || !env.s3Bucket) return null;
  const key = stored.startsWith(bucketUrl()) ? stored.slice(bucketUrl().length) : stored;
  return /^listings\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp|gif)$/.test(key) ? key : null;
}

/** A link to a stored photo that works for an hour; null if it isn't one of ours. */
export async function photoLink(stored: string | null | undefined): Promise<string | null> {
  const key = ownPhotoKey(stored);
  if (!key) return null;
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(new S3Client({ region: env.awsRegion }), new GetObjectCommand({ Bucket: env.s3Bucket, Key: key }), { expiresIn: 3600 });
}

/**
 * Return a presigned S3 PUT URL the client uploads the photo to directly,
 * plus the key to save with the listing. Keeps image bytes off the API server.
 */
router.post("/presign", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const { contentType } = schema.parse(req.body);
  if (!env.s3Bucket) return res.status(501).json({ error: "Uploads not configured (set S3_BUCKET)" });

  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const key = `listings/${req.userId}/${randomUUID()}.${ext}`;

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const s3 = new S3Client({ region: env.awsRegion });
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: env.s3Bucket, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );
  res.json({ uploadUrl, fileUrl: key, key });
}));

export default router;
