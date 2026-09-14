import { AppError } from '../utils/errors.js';
export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!parsed.success) return next(new AppError(parsed.error.issues.map(i => i.message).join('; '), 422, 'VALIDATION_ERROR'));
  req.validated = parsed.data;
  next();
};
