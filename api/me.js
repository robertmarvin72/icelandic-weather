// api/me.js
import { getMeFromRequest } from "./_lib/getMe.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const me = await getMeFromRequest(req);

    // ✅ Always return stable shape even when logged out
    if (!me) {
      res.status(200).json({
        ok: true,
        user: null,
        subscription: null,
        entitlements: { pro: false, proUntil: null },
      });
      return;
    }

    res.status(200).json({
      ok: true,
      user: me.user,
      subscription: me.subscription,
      entitlements: me.entitlements,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
