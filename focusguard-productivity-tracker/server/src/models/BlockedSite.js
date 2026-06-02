import mongoose from "mongoose";

/**
 * blockedSites collection
 * Simple list of domains the user wants blocked.
 */
const blockedSiteSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const BlockedSite = mongoose.model("BlockedSite", blockedSiteSchema);
