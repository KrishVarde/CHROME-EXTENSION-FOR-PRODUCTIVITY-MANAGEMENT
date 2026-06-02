import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import analyticsRoutes from "./routes/analytics.js";
import blockedRoutes from "./routes/blocked.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "FocusGuard API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/analytics", analyticsRoutes);
app.use("/api/blocked",   blockedRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: "Internal server error." });
});

// ── Start ──────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀  FocusGuard API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Analytics: http://localhost:${PORT}/api/analytics/today`);
    console.log(`   Blocked: http://localhost:${PORT}/api/blocked\n`);
  });
}

start();
