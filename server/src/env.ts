import dotenv from "dotenv";
import { randomBytes } from "crypto";
dotenv.config();

// Sign-in tokens are signed with JWT_SECRET. In production it must be set (32+ characters);
// otherwise the server refuses to start. In development a random one is made per run, so
// tokens stop working on restart, but no well-known default can ever sign a real token.
function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 32 && !/change-me/i.test(s)) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set JWT_SECRET to a random string of 32+ characters (openssl rand -hex 32)");
  }
  console.warn("JWT_SECRET not set: using a random one for this run (sign-ins end on restart)");
  return randomBytes(32).toString("hex");
}

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: jwtSecret(),
  // Password-reset codes go out by email through Resend; without these, reset is unavailable.
  resendApiKey: process.env.RESEND_API_KEY || "",
  mailFrom: process.env.MAIL_FROM || "",
  databaseUrl: process.env.DATABASE_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  awsRegion: process.env.AWS_REGION || "us-west-2",
  s3Bucket: process.env.S3_BUCKET || "",
  snsPlatformAppArn: process.env.SNS_PLATFORM_APP_ARN || "",
};
