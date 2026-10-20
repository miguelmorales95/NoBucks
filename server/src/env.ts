import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  databaseUrl: process.env.DATABASE_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  awsRegion: process.env.AWS_REGION || "us-west-2",
  s3Bucket: process.env.S3_BUCKET || "",
  snsPlatformAppArn: process.env.SNS_PLATFORM_APP_ARN || "",
};
