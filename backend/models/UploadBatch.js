import mongoose from 'mongoose';

const uploadBatchSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    /** auto = UTM matching; manual = review sheet as-is and assign by hand */
    mode: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto',
      index: true,
    },
    /** Excel header order preserved for manual review tables */
    columns: {
      type: [String],
      default: [],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    autoMatchedCount: {
      type: Number,
      default: 0,
    },
    unmatchedCount: {
      type: Number,
      default: 0,
    },
    selfAccountCount: {
      type: Number,
      default: 0,
    },
    duplicateSkippedCount: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const UploadBatch = mongoose.model('UploadBatch', uploadBatchSchema);

export default UploadBatch;
