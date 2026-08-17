import mongoose from 'mongoose';

/**
 * LinkUsage — records the FIRST successful/valid click for a (link, user) pair.
 *
 * This is the one-time-click enforcement layer. A document here means that
 * user has already redeemed that link; further clicks should be blocked
 * (and still logged in ClickEvent) then redirected home.
 *
 * ClickEvent stays separate so we can keep full attempt history without using
 * that history collection as the uniqueness/race-condition gate.
 *
 * The compound unique index on (linkId, userId) enforces one redeem per pair
 * at the database level (safe against double-tap race conditions).
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

// Critical: one successful use per (link, user) — DB-level race protection
linkUsageSchema.index({ linkId: 1, userId: 1 }, { unique: true });

const LinkUsage = mongoose.model('LinkUsage', linkUsageSchema);

export default LinkUsage;
