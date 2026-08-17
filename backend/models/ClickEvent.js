import mongoose from 'mongoose';

/**
 * ClickEvent — append-only history of EVERY tracking-link click attempt.
 *
 * Kept separate from LinkUsage on purpose:
 * - ClickEvent = full analytics trail (who clicked, when, IP/UA, including
 *   repeats and blocked second attempts).
 * - LinkUsage = only the first successful redeem (one-time enforcement).
 *
 * Analytics later can count total attempts, unique users, etc. from this
 * collection without conflating it with "was this click allowed?" logic.
 */
const clickEventSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: [true, 'linkId is required'],
      index: true, // Total attempts / analytics per link
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true, // Per-user click history
    },
    clickedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
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

const ClickEvent = mongoose.model('ClickEvent', clickEventSchema);

export default ClickEvent;
