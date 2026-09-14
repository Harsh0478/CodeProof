export function verificationLabel(score) {
  if (score === null || score === undefined) return 'AI REVIEW REQUIRED';
  if (score >= 90) return 'VERIFIED';
  if (score >= 50) return 'PARTIALLY VERIFIED';
  return 'FAILED';
}
