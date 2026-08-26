// src/lib/researchQuiz/session.js
//
// Random session identifier — deliberately NOT tied to any app user/account
// ID, cookie, or auth session (approved prompt: "Do not include ... app
// user/account/session ID, cookie"). Pure randomness only.

export function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (defensive only —
  // every supported deployment target has it).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
