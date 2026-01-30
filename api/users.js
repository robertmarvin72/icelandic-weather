import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL, {
  ssl: "require",
});

export default async function handler(req, res) {
  try {
    const users = await sql`
      select
        id,
        email,
        tier,
        created_at
      from app_user
      order by created_at desc
      limit 10
    `;

    res.status(200).json({
      ok: true,
      count: users.length,
      users,
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}
