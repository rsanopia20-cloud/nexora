import mongoose from 'mongoose';

const conversionRecordSchema = new mongoose.Schema(
  {
    uploadBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadBatch',
      required: true,
      index: true,
    },
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    clientCode: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      trim: true,
      default: '',
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
    },
    appStatus: {
      type: String,
      trim: true,
      default: '',
    },
    utmMedium: {
      type: String,
      trim: true,
      default: '',
    },
    utmCampaign: {
      type: String,
      trim: true,
      default: '',
    },
    matchedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    matchType: {
      type: String,
      enum: ['auto', 'manual', 'unmatched', 'ignored'],
      default: 'unmatched',
    },
    isSelfAccount: {
      type: Boolean,
      default: false,
    },
    isPayable: {
      type: Boolean,
      default: false,
    },
    commissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidStatus: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    editHistory: [
      {
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
        editorLabel: {
          type: String,
          default: 'Admin',
          trim: true,
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
        changes: {
          type: String,
          default: '',
          trim: true,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Same broker client code must never be counted twice across overlapping uploads.
conversionRecordSchema.index({ linkId: 1, clientCode: 1 }, { unique: true });

const ConversionRecord = mongoose.model('ConversionRecord', conversionRecordSchema);

export default ConversionRecord;
