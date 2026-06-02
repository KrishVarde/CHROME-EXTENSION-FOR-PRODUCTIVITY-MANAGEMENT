import { Router } from "express";
import { WebsiteAnalytics } from "../models/WebsiteAnalytics.js";

const router = Router();

// ── POST /api/analytics/track ──────────────────────
// Body: { domain, seconds, date? }
router.post("/track", async (req, res) => {
  try {
    const { domain, seconds, date } = req.body;

    if (!domain || typeof seconds !== "number" || seconds <= 0) {
      return res.status(400).json({ error: "domain and positive seconds are required." });
    }

    const trackDate = date || new Date().toISOString().split("T")[0];

    // Upsert: create or accumulate
    const doc = await WebsiteAnalytics.findOneAndUpdate(
      { domain, date: trackDate },
      { $inc: { seconds, visits: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, data: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/today ───────────────────────
router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const records = await WebsiteAnalytics.find({ date: today }).sort({ seconds: -1 });
    res.json({ date: today, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/week ────────────────────────
router.get("/week", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const records = await WebsiteAnalytics.aggregate([
      { $match: { date: { $gte: sinceStr } } },
      {
        $group: {
          _id: "$domain",
          totalSeconds: { $sum: "$seconds" },
          totalVisits:  { $sum: "$visits" },
          days:         { $addToSet: "$date" },
        },
      },
      { $sort: { totalSeconds: -1 } },
      { $limit: 20 },
    ]);

    res.json({ since: sinceStr, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/summary ─────────────────────
router.get("/summary", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const [todayData, weekData, dailyBreakdown] = await Promise.all([
      WebsiteAnalytics.find({ date: today }).sort({ seconds: -1 }),
      WebsiteAnalytics.aggregate([
        { $match: { date: { $gte: weekAgoStr } } },
        { $group: { _id: "$domain", totalSeconds: { $sum: "$seconds" } } },
        { $sort: { totalSeconds: -1 } },
        { $limit: 10 },
      ]),
      WebsiteAnalytics.aggregate([
        { $match: { date: { $gte: weekAgoStr } } },
        { $group: { _id: "$date", totalSeconds: { $sum: "$seconds" } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const todayTotal = todayData.reduce((s, r) => s + r.seconds, 0);
    const weekTotal = weekData.reduce((s, r) => s + r.totalSeconds, 0);

    res.json({
      today: {
        total: todayTotal,
        topSites: todayData.slice(0, 5),
      },
      week: {
        total: weekTotal,
        topSites: weekData,
        dailyBreakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/analytics ──────────────────────────
router.delete("/", async (req, res) => {
  try {
    const { date } = req.query;
    const filter = date ? { date } : {};
    const result = await WebsiteAnalytics.deleteMany(filter);
    res.json({ ok: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
