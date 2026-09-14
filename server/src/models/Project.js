import mongoose from 'mongoose';
const projectSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, name: String, description: String, translations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Translation' }] }, { timestamps: true });
export default mongoose.model('Project', projectSchema);
