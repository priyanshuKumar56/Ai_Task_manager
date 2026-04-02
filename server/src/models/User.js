const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    taskCount: {
      type: Number,
      default: 0,
    },
    tokenVersion: {
      type: Number,
      default: 0, // For token invalidation
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        delete ret.tokenVersion;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1, createdAt: -1 });

// ─── Pre-save Hook: Hash Password ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementTaskCount = async function () {
  this.taskCount += 1;
  return this.save();
};

userSchema.methods.invalidateTokens = async function () {
  this.tokenVersion += 1;
  return this.save();
};

// ─── Static Methods ───────────────────────────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true }).select('+password +tokenVersion');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
