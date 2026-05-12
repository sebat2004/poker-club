export function getAllowedMemberEmails() {
  return (process.env.ALLOWED_MEMBER_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedMember(email?: string | null) {
  if (!email) return false;

  return getAllowedMemberEmails().includes(email.toLowerCase());
}