import express from "express";
import cors from "cors";
import { env } from "./env";
import authRoutes from "./routes/auth";
import listingRoutes from "./routes/listings";
import uploadRoutes from "./routes/uploads";
import threadRoutes from "./routes/threads";
import villageRoutes from "./routes/village";
import moderationRoutes from "./routes/moderation";
import notificationRoutes from "./routes/notifications";
import walletRoutes from "./routes/wallet";
import gratitudeRoutes from "./routes/gratitudes";

const app = express();
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "clover-api" }));

app.use("/auth", authRoutes);
app.use("/listings", listingRoutes);
app.use("/uploads", uploadRoutes);
app.use("/threads", threadRoutes);
app.use("/village", villageRoutes);
app.use("/moderation", moderationRoutes);
app.use("/notifications", notificationRoutes);
app.use("/wallet", walletRoutes);
app.use("/gratitudes", gratitudeRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(env.port, () => {
  console.log(`Clover API listening on :${env.port}`);
});
