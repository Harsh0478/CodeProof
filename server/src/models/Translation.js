import mongoose from 'mongoose';
const translationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sourceLanguage: { type: String, required: true },
  targetLanguage: { type: String, required: true },
  sourceCode: { type: String, required: true },
  generatedCode: { type: String, required: true },
  aiProvider: { type: String, enum: ['groq', 'gemini', 'demo'], required: true },
  aiModel: { type: String, required: true },
  aiReview: { type: mongoose.Schema.Types.Mixed, default: null },
  verificationScore: { type: Number, default: null },
  status: { type: String, enum: ['VERIFIED', 'PARTIALLY VERIFIED', 'FAILED', 'COMPILATION ERROR', 'RUNTIME ERROR', 'AI REVIEW REQUIRED', 'DEMO'], required: true },
  summary: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });
translationSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.model('Translation', translationSchema);
