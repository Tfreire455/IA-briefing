import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true, maxlength: 80 },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role:         { type: String, enum: ['admin', 'user'], default: 'user' },
    active:       { type: Boolean, default: true },

    // Password reset
    resetToken:      { type: String, select: false },
    resetTokenExpiry:{ type: Date,   select: false },

    // Security tracking
    lastLoginAt:   { type: Date },
    failedAttempts:{ type: Number, default: 0 },
    lockedUntil:   { type: Date },
  },
  { timestamps: true }
);

// ── Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ resetToken: 1 });

// ── Virtual: never expose passwordHash
UserSchema.methods.verifyPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

// ── Static: hash password
UserSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
