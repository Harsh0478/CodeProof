import mongoose from 'mongoose';
import Sample from '../models/Sample.js';
import { AppError } from '../utils/errors.js';

function ensureValidId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid sample id.', 400, 'INVALID_SAMPLE_ID');
}

export async function list(req, res) {
  const userId = req.user?._id ?? null;
  const filter = userId
    ? { $or: [{ isBuiltIn: true }, { createdBy: userId }] }
    : { isBuiltIn: true };
  const items = await Sample.find(filter).sort({ isBuiltIn: -1, category: 1, name: 1 }).lean();
  res.json({ success: true, items });
}

export async function getOne(req, res) {
  ensureValidId(req.params.id);
  const item = await Sample.findById(req.params.id).lean();
  if (!item) throw new AppError('Sample not found.', 404, 'SAMPLE_NOT_FOUND');
  if (!item.isBuiltIn && String(item.createdBy) !== String(req.user._id)) {
    throw new AppError('You do not have access to this sample.', 403, 'FORBIDDEN');
  }
  res.json({ success: true, item });
}

export async function create(req, res) {
  const { name, sourceLanguage, targetLanguage, sourceCode, expectedCode = '', description = '', category = 'Other' } = req.body;
  if (!name || !sourceLanguage || !targetLanguage || !sourceCode) {
    throw new AppError('Name, source language, target language and source code are required.', 400, 'INVALID_SAMPLE');
  }
  const item = await Sample.create({ name, sourceLanguage, targetLanguage, sourceCode, expectedCode, description, category, createdBy: req.user._id, isBuiltIn: false });
  res.status(201).json({ success: true, item });
}

export async function update(req, res) {
  ensureValidId(req.params.id);
  const item = await Sample.findById(req.params.id);
  if (!item) throw new AppError('Sample not found.', 404, 'SAMPLE_NOT_FOUND');
  if (item.isBuiltIn) throw new AppError('Built-in samples cannot be edited.', 403, 'BUILT_IN_SAMPLE');
  if (String(item.createdBy) !== String(req.user._id)) throw new AppError('You can only edit your own samples.', 403, 'FORBIDDEN');

  const allowed = ['name', 'sourceLanguage', 'targetLanguage', 'sourceCode', 'expectedCode', 'description', 'category'];
  for (const key of allowed) if (req.body[key] !== undefined) item[key] = req.body[key];
  await item.save();
  res.json({ success: true, item });
}

export async function remove(req, res) {
  ensureValidId(req.params.id);
  const item = await Sample.findById(req.params.id);
  if (!item) throw new AppError('Sample not found.', 404, 'SAMPLE_NOT_FOUND');
  if (item.isBuiltIn) throw new AppError('Built-in samples cannot be deleted.', 403, 'BUILT_IN_SAMPLE');
  if (String(item.createdBy) !== String(req.user._id)) throw new AppError('You can only delete your own samples.', 403, 'FORBIDDEN');
  await item.deleteOne();
  res.json({ success: true });
}
