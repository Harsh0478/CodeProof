import { Router } from 'express';
import { me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const r = Router();
r.get('/me', requireAuth, asyncHandler(me));
export default r;
