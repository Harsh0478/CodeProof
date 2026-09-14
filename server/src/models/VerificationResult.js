import mongoose from 'mongoose';
const verificationSchema = new mongoose.Schema({
  translationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Translation', required: true, index: true },
  score: Number,
  totalTests: Number,
  passedTests: Number,
  failedTests: Number,
  compilationErrors: Number,
  runtimeErrors: Number,
  executionTime: Number,
  aiConfidence: Number,
  evidence: { type: String, default: '' }
}, { timestamps: true });
export default mongoose.model('VerificationResult', verificationSchema);
