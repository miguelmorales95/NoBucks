import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { requireAuth, wrap, type AuthedRequest } from "../auth";
import { env } from "../env";

const router = Router();

const schema = z.object({
  contentType: z.string().regex(/^image\/(png|jpe?g|webp|gif)$/),
});

/**
 * Return a presigned S3 PUT URL the client uploads the photo to directly,
 * plus the URL the photo will live at. Keeps image bytes off the API server.
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
  const fileUrl = `https://${env.s3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
  res.json({ uploadUrl, fileUrl, key });
}));

export default router;
