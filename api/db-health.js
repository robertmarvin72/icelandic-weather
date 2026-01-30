import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL, {
  ssl: "require",
  // You can tweak these later; defaults are fine for now.
});

export default async function handler(req, res) {
  try {
    const result = await sql`select 1 as ok`;
    res.status(200).json({ ok: true, db: result[0].ok });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
