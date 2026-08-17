import mongoose from 'mongoose';

/**
 * TrackingCode — maps a short public code (e.g. "aB3xY9") to a (linkId, userId)
 * pair so WhatsApp can show friendly URLs like /l/aB3xY9 instead of long
 * signed tokens. One-time click enforcement remains on LinkUsage; this model
 * is only the short-code → identity lookup table.
 */
const trackingCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'code is required'],
      unique: true,
      trim: true,
      index: true,
    },
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
    createdAt: {
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

// Fast lookup by (link, user) when reusing an existing short code
trackingCodeSchema.index({ linkId: 1, userId: 1 });

const TrackingCode = mongoose.model('TrackingCode', trackingCodeSchema);

export default TrackingCode;
