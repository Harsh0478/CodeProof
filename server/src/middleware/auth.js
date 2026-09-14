import { clerkClient, getAuth } from '@clerk/express';
import User from '../models/User.js';
import { AppError } from '../utils/errors.js';

export async function requireAuth(req, res, next) {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');

    let user = await User.findOne({ clerkUserId: userId });
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses?.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress
        || clerkUser.emailAddresses?.[0]?.emailAddress;
      if (!email) throw new AppError('Your Clerk account does not have a verified email address.', 422, 'EMAIL_REQUIRED');

      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim()
        || clerkUser.username
        || 'CodeProof User';

      user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { $set: { clerkUserId: userId, name, email: email.toLowerCase() }, $setOnInsert: { passwordHash: undefined } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    req.user = user;
    req.clerkUserId = userId;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Unable to validate Clerk session.', 401, 'UNAUTHORIZED'));
  }
}
