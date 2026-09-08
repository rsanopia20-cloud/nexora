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
    /** Which upload flow created this row (manual batches skip UTM auto-match). */
    uploadMode: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto',
      index: true,
    },
    /** Full Excel row as uploaded (any columns) — used by manual review UI. */
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rowIndex: {
      type: Number,
      default: 0,
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
    /** Last-10-digit form of `mobile` for fast, exact user-claim lookups. */
    mobileNormalized: {
      type: String,
      trim: true,
      default: '',
      index: true,
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
      enum: ['auto', 'manual', 'unmatched', 'ignored', 'claimed'],
      default: 'unmatched',
    },
    /** When a user self-claimed this record (null until claimed). */
    claimedAt: {
      type: Date,
      default: null,
    },
    /** Manager credited on claim (required for user self-claims). */
    matchedManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
      default: null,
      index: true,
    },
    /** Full link commission before the 70/30 split. */
    totalCommissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Manager's 30% share (users never see this amount). */
    managerCommissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    managerPaidStatus: {
      type: Boolean,
      default: false,
    },
    managerPaidAt: {
      type: Date,
      default: null,
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
    /** User payment status for their 70% share. */
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
// Fast per-link user-claim search by normalized mobile.
conversionRecordSchema.index({ linkId: 1, mobileNormalized: 1 });

const ConversionRecord = mongoose.model('ConversionRecord', conversionRecordSchema);

export default ConversionRecord;
