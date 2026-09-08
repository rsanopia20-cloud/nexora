import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const managerSchema = new mongoose.Schema(
  {
    managerId: {
      type: String,
      required: [true, 'Manager ID is required'],
      trim: true,
      unique: true,
      uppercase: true,
      minlength: [3, 'Manager ID must be at least 3 characters'],
      maxlength: [32, 'Manager ID must be at most 32 characters'],
      match: [
        /^[A-Z0-9_-]+$/,
        'Manager ID can only contain letters, numbers, hyphens, and underscores',
      ],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [80, 'Full name must be at most 80 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      validate: {
        validator(value) {
          if (!value) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Enter a valid email address',
      },
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator(value) {
          if (!value) return true;
          return /^[6-9]\d{9}$/.test(value);
        },
        message: 'Enter a valid 10-digit Indian mobile number',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes must be at most 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

managerSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

managerSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const Manager = mongoose.model('Manager', managerSchema);

export default Manager;
