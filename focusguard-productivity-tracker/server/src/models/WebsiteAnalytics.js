import mongoose from "mongoose";

/**
 * websiteAnalytics collection
 * One document per (domain, date) pair.
 * Seconds are accumulated via $inc on upsert.
 */
const websiteAnalyticsSchema = new mongoose.Schema(
  {
    domain:  { type: String, required: true, lowercase: true, trim: true },
    date:    { type: String, required: true }, // "YYYY-MM-DD"
    seconds: { type: Number, default: 0, min: 0 },
    visits:  { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

websiteAnalyticsSchema.index({ domain: 1, date: 1 }, { unique: true });
websiteAnalyticsSchema.index({ date: 1 });

export const WebsiteAnalytics = mongoose.model(
  "WebsiteAnalytics",
  websiteAnalyticsSchema
);
