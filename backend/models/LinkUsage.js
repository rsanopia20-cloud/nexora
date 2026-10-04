import mongoose from 'mongoose';

/**
 * LinkUsage — records the FIRST successful click for a (link, user) pair.
 *
 * Used for analytics only ("was used" / unique users). Clicks are no longer
 * blocked after the first use — every click still goes to the destination and
 * is logged in ClickEvent.
 *
 * The compound unique index on (linkId, userId) keeps one first-use row per
 * pair (safe against double-tap race conditions when creating this marker).
 */
const linkUsageSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: [true, 'linkId is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// One first-use marker per (link, user) — DB-level race protection
linkUsageSchema.index({ linkId: 1, userId: 1 }, { unique: true });

const LinkUsage = mongoose.model('LinkUsage', linkUsageSchema);

export default LinkUsage;
