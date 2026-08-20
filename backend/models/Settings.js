import mongoose from 'mongoose';

const PAYABLE_STATUSES_KEY = 'payableAppStatuses';
const DEFAULT_PAYABLE_STATUSES = ['Ready To Trade'];

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    values: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

settingsSchema.statics.getPayableStatuses = async function getPayableStatuses() {
  let doc = await this.findOne({ key: PAYABLE_STATUSES_KEY });

  if (!doc) {
    doc = await this.create({
      key: PAYABLE_STATUSES_KEY,
      values: DEFAULT_PAYABLE_STATUSES,
    });
  }

  return doc.values;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
