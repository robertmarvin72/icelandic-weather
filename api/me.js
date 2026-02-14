// /api/me.js

import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.json({ pro: false });
  }

  const sub = await sql`
    select *
    from subscription
    where email = ${email}
    and status = 'active'
    limit 1
  `;

  if (sub.length === 0) {
    return res.json({ pro: false });
  }

  const row = sub[0];

  const plan =
    row.price_id === process.env.PADDLE_PRICE_YEARLY
      ? "yearly"
      : "monthly";

  return res.json({
    pro: true,
    proUntil: row.current_period_end,
    subscription: {
      plan,
    },
  });
}
