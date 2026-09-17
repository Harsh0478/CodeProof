import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { runVerification } from "../services/verification/VerificationService.js";
import Translation from "../models/Translation.js";
import TestCase from "../models/TestCase.js";
import { AppError } from "../utils/errors.js";
const r = Router();
r.use(requireAuth);
r.post(
  "/run",
  asyncHandler(async (req, res) => {
    const result = await runVerification(req.body);
    res.json({ success: true, result });
  }),
);
r.post(
  "/run-test",
  asyncHandler(async (req, res) => {
    const { translationId, test } = req.body;
    const tr = await Translation.findOne({
      _id: translationId,
      userId: req.user._id,
    });
    if (!tr) throw new AppError("Translation not found.", 404);
    const t = await TestCase.create({
      translationId: tr._id,
      name: test.name,
      input: test.input,
      expectedOutput: test.expectedOutput || "",
    });
    res.json({ success: true, testCase: t });
  }),
);
r.post(
  "/run-all",
  asyncHandler(async (req, res) => {
    const tr = await Translation.findOne({
      _id: req.body.translationId,
      userId: req.user._id,
    });
    if (!tr) throw new AppError("Translation not found.", 404);
    const tests = await TestCase.find({ translationId: tr._id }).lean();
    res.json({ success: true, tests });
  }),
);
export default r;
