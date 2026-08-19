import mongoose from 'mongoose';

/**
 * Link — admin-managed destination URLs that get turned into per-user
 * tracking links after signup. These are a fixed pool (not created per user);
 * each user later receives signed /t/{linkId}.{userId}.{signature} URLs that
 * redirect here on first valid click.
 */
const linkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Link name is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination URL is required'],
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true, // Fast lookup of the active link pool when assigning links to users
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
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

const Link = mongoose.model('Link', linkSchema);

export const LINK_SORT = { sortOrder: 1, createdAt: 1 };

export default Link;
