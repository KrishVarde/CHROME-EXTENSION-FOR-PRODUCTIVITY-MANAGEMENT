import { Router } from "express";
import { BlockedSite } from "../models/BlockedSite.js";

const router = Router();

const DEFAULT_BLOCKED = [
  "youtube.com",
  "instagram.com",
  "reddit.com",
  "facebook.com",
];

// ── GET /api/blocked ───────────────────────────────
router.get("/", async (req, res) => {
  try {
    const sites = await BlockedSite.find().sort({ addedAt: 1 });

    // Seed defaults if DB is empty
    if (sites.length === 0) {
      const docs = await BlockedSite.insertMany(
        DEFAULT_BLOCKED.map((domain) => ({ domain })),
        { ordered: false }
      ).catch(() => null);
      const seeded = await BlockedSite.find().sort({ addedAt: 1 });
      return res.json({ sites: seeded });
    }

    res.json({ sites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/blocked ──────────────────────────────
// Body: { domain }
router.post("/", async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: "domain is required." });

    const clean = domain.toLowerCase().trim().replace(/^www\./, "");

    const existing = await BlockedSite.findOne({ domain: clean });
    if (existing) {
      return res.status(409).json({ error: "Domain already blocked.", site: existing });
    }

    const site = await BlockedSite.create({ domain: clean });
    res.status(201).json({ ok: true, site });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/blocked/:domain ────────────────────
router.delete("/:domain", async (req, res) => {
  try {
    const domain = decodeURIComponent(req.params.domain)
      .toLowerCase()
      .replace(/^www\./, "");

    const result = await BlockedSite.findOneAndDelete({ domain });
    if (!result) return res.status(404).json({ error: "Domain not found." });

    res.json({ ok: true, removed: domain });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/blocked/check/:domain ────────────────
router.get("/check/:domain", async (req, res) => {
  try {
    const domain = decodeURIComponent(req.params.domain)
      .toLowerCase()
      .replace(/^www\./, "");

    const site = await BlockedSite.findOne({ domain });
    res.json({ blocked: !!site });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
