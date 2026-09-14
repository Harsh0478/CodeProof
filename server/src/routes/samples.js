import { Router } from 'express';
import { list, getOne, create, update, remove } from '../controllers/sampleController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
r.get('/', requireAuth, asyncHandler(list));
r.get('/:id', requireAuth, asyncHandler(getOne));
r.post('/', requireAuth, asyncHandler(create));
r.put('/:id', requireAuth, asyncHandler(update));
r.delete('/:id', requireAuth, asyncHandler(remove));

export default r;
