import mongoose from 'mongoose';
const testCaseSchema = new mongoose.Schema({
  translationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Translation', required: true, index: true },
  name: { type: String, default: 'TC_01' },
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  originalOutput: { type: String, default: '' },
  actualOutput: { type: String, default: '' },
  status: { type: String, enum: ['PASS', 'FAIL', 'COMPILATION_ERROR', 'RUNTIME_ERROR', 'UNAVAILABLE'], default: 'UNAVAILABLE' },
  executionTime: { type: Number, default: 0 },
  error: { type: String, default: null }
}, { timestamps: true });
export default mongoose.model('TestCase', testCaseSchema);
