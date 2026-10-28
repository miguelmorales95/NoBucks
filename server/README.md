# NoBucks API

The backend for NoBucks: **Node + TypeScript + Express + Prisma**, backed by **PostgreSQL** and
deployed on **AWS**. It handles accounts, verification, listings, photo uploads, messaging, the
sprout economy (escrow + ledger), ratings, the village, moderation, and notifications.

## Why PostgreSQL (not DynamoDB)

NoBucks moves credits between people with escrow, releases, and refunds, and reads relational feeds
(by distance, category, author, rating). That's a transactional, relational workload, so a SQL
database with ACID transactions is the right fit. On AWS that means **Amazon RDS for PostgreSQL**,
or **Aurora Serverless v2 (PostgreSQL)** if you want it to scale to zero between bursts.

## Local development

```bash
cd server
cp .env.example .env            # fill in DATABASE_URL + JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate          # creates tables in your dev database
npm run seed                    # optional demo data
npm run dev                     # http://localhost:4000/health
```

You need a Postgres instance. Fastest local option:

```bash
docker run --name nobucks-pg -e POSTGRES_PASSWORD=password -e POSTGRES_DB=nobucks -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://postgres:password@localhost:5432/nobucks?schema=public
```

## API surface

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register` (needs `adult: true`), `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot`, `POST /auth/reset` |
| Your account | `GET /auth/me/export` (all your data as JSON), `POST /auth/logout-all`, `DELETE /auth/me` (with password) |
| Leaders | `GET /admin/overview`, `GET /admin/reports`, `POST /admin/reports/:id/resolve`, `GET /admin/members/unverified`, `POST /admin/members/:id/verify`, `POST /admin/members/verify-by-email`: all limited to the leader's own neighborhood |
| Listings | `GET /listings` (filters: `type`, `category`, `lat`, `lng`, `maxDist`), `POST /listings`, `GET /listings/:id` |
| Photos | `POST /uploads/presign` → presigned S3 PUT URL |
| Messaging & trades | `GET /threads`, `POST /threads`, `GET /threads/:id`, `POST /threads/:id/messages`, `POST /threads/:id/reserve`, `POST /threads/:id/complete`, `POST /threads/:id/rate` |
| Village | `GET /village`, `POST /village` |
| Moderation | `POST /moderation/reports`, `GET/POST /moderation/blocks`, `DELETE /moderation/blocks/:id` |
| Notifications | `GET /notifications`, `POST /notifications/read`, `POST /notifications/devices` |

All routes except `register`/`login`/`forgot`/`reset` require `Authorization: Bearer <token>`.

## Safety rules the code enforces

- **Leaders are appointed, never self-made:** `npm run make-leader -- <email> "<neighborhood>"` (or
  `--remove`). Leader tools only see and act on their own neighborhood.
- **Verification is in person:** a leader verifies a neighbor (by the email they signed up with), which also
  adds them to the leader's neighborhood. There is no self-serve "check".
- **Sessions can be ended:** tokens carry a version; sign-out-everywhere, a password reset and deleting the
  account all end every existing token.
- **`JWT_SECRET` is required in production** (32+ random characters); the server won't start without it.
- **Adults only:** registration needs `adult: true` (the app asks "I'm 18 or older").
- **Location stays rough:** stored to about a kilometer, distances shown in half-mile steps (min 0.5).
- **Photos are private:** keep the bucket's public access blocked; the API hands out one-hour links and
  only accepts photos uploaded through `/uploads/presign`. The web app strips EXIF before uploading.
- **Phone notifications carry only a title** ("New message from Ana"), never message text.
- **Events are per neighborhood:** you see and join only your own neighborhood's events.
- Password reset needs `RESEND_API_KEY` and `MAIL_FROM`; without them `/auth/forgot` answers 501.

**Schema changes (2026-10-29):** `User` gained `tokenVersion`, `adultAt`, `deletedAt`, `verifiedById`,
`verifiedAt`, and there's a new `PasswordReset` table. Not applied to any shared database: create the
pilot's own database and run `npx prisma migrate dev --name security` there first.

## The sprout economy (escrow)

- A receiver **reserves** sprouts → balance debited, held on the thread, `Transaction(RESERVE)`.
- On **complete**, the hold is **released** to the provider → `Transaction(RELEASE)`; if no reservation
  existed (e.g. a request the helper fulfilled), it settles from the client's balance at completion.
- Every movement is an auditable row in `Transaction`, so balances are always reconstructable.
- Ratings are only accepted once a thread is `DONE` (one rating per person per trade).

## Deploying on AWS

**Database — RDS / Aurora PostgreSQL**
1. Create an RDS PostgreSQL (or Aurora Serverless v2) instance in a private subnet.
2. Put the connection string in `DATABASE_URL` (require SSL: `...?sslmode=require`).
3. Migrations run automatically on container start (`prisma migrate deploy` in the Dockerfile `CMD`).

**Photos — S3**
1. Create a private bucket, set `S3_BUCKET` and `AWS_REGION`.
2. Add a CORS rule allowing `PUT` from your web origin so browsers can upload to the presigned URL.
3. Serve images via CloudFront (recommended) or presigned GET URLs.

**API — App Runner (simplest) or ECS Fargate**
```bash
# Build & push the image to ECR, then point App Runner / ECS at it.
aws ecr create-repository --repository-name nobucks-api
docker build -t nobucks-api ./server
# docker tag + docker push to the ECR URI, then create an App Runner service from that image.
```
- Give the service an **IAM role** with `s3:PutObject`/`GetObject` on the bucket (and `sns:Publish`
  if using push). Then you don't need AWS keys in env.
- Store `JWT_SECRET` and `DATABASE_URL` in **AWS Secrets Manager** / SSM and inject them.

**Auth / social sign-in — Cognito (recommended)**
- Create a Cognito User Pool with Google / Apple / Facebook as federated identity providers.
- Swap the email/password handlers for Cognito-issued JWT verification (validate the pool's JWKS),
  keeping the same `requireAuth` middleware shape.

**Push notifications**
- Mobile (Expo/React Native): register device tokens via `POST /notifications/devices`, create SNS
  platform endpoints, set `SNS_PLATFORM_APP_ARN`. `notifyUser()` already fans out to SNS when set.
- Web: swap in Web Push (VAPID) using the stored subscription JSON.

**Frontend hosting**
- Build the Vite app (`npm run build` in the repo root) and host `dist/` on **S3 + CloudFront**.
- Set `VITE_API_URL` to the App Runner / ECS URL at build time.

## Next step: wire the frontend

The web app currently runs on an in-memory store (`src/store.tsx`). `src/api.ts` is a typed client
for this API; the integration is to replace the action bodies in the store with `api.*` calls.
