import mongoose from 'mongoose';

const sampleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sourceLanguage: { type: String, required: true, trim: true },
  targetLanguage: { type: String, required: true, trim: true },
  sourceCode: { type: String, required: true },
  expectedCode: { type: String, default: '' },
  description: { type: String, default: '', trim: true },
  category: { type: String, default: 'Other', trim: true },
  isBuiltIn: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

sampleSchema.index({ category: 1, name: 1 });
sampleSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('Sample', sampleSchema);
