const EMAIL_VERIFICATION_STATUSES = new Set([
  "success",
  "already",
  "expired",
  "invalid",
]);

export function normalizeEmailVerificationStatus(status) {
  return typeof status === "string" && EMAIL_VERIFICATION_STATUSES.has(status)
    ? status
    : "invalid";
}
