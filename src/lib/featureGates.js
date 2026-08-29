// Temporary UI-only feature gate for the email-sending prototype.
//
// This is NOT a security boundary — it only controls whether the Send
// Invoice/Quote UI is rendered in the browser. There is no server-side
// enforcement yet (no Edge Function, no settings.data.features flag), so
// this must never be treated as anything more than a frontend visibility
// switch while the UX is being reviewed.
//
// Replace this with a real settings.data.features flag (checked both
// client-side and inside the future send-email Edge Function) once the
// backend is built — see CLAUDE.md's "Known technical debt" conventions
// for how per-user config already lives in settings.data.
const EMAIL_SENDING_BETA_USER_IDS = [
  "d02041e7-e45d-4095-a729-9fe693691731",
  "409fb9a8-3a1c-4fe7-82ad-faa3a32ee496",
];

export function isEmailSendingEnabled(userId) {
  return Boolean(userId) && EMAIL_SENDING_BETA_USER_IDS.includes(userId);
}
