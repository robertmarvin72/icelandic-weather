export default async function handler(req, res) {
  // Paddle sendir webhook sem POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // TODO: verify signature + parse body + update DB
  // Fyrst viljum við bara sjá að Paddle nær 200.
  return res.status(200).json({ ok: true });
}
