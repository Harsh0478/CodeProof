export async function me(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      clerkUserId: req.user.clerkUserId,
      name: req.user.name,
      email: req.user.email,
      preferences: req.user.preferences,
      createdAt: req.user.createdAt,
    },
  });
}
