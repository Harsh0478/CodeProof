import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkUserId: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, trim: true, required: true, maxlength: 80 },
  email: { type: String, trim: true, lowercase: true, unique: true, index: true, required: true },
  // Kept optional so legacy CodeProof records can be linked to Clerk by email.
  passwordHash: { type: String, select: false },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    defaultSource: { type: String, default: 'C' },
    defaultTarget: { type: String, default: 'Java' },
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
