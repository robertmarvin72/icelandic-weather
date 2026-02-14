// /api/checkout.js

import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

const PADDLE_BASE =
  process.env.PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";

async function paddleRequest(path, method = "GET", body) {
  const res = await fetch(`${PADDLE_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }

  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { email, priceId } = req.body;

  if (!email || !priceId) {
    return res.status(400).json({ ok: false });
  }

  const isMonthly = priceId === process.env.PADDLE_PRICE_MONTHLY;
  const isYearly = priceId === process.env.PADDLE_PRICE_YEARLY;

  if (!isMonthly && !isYearly) {
    return res.status(400).json({ ok: false });
  }

  // ------------------------------------------------
  // 1️⃣ CHECK EXISTING ACTIVE SUB
  // ------------------------------------------------

  const existing = await sql`
    select *
    from subscription
    where email = ${email}
    and status = 'active'
    limit 1
  `;

  if (existing.length > 0) {
    const sub = existing[0];

    const existingPlan =
      sub.price_id === process.env.PADDLE_PRICE_YEARLY
        ? "yearly"
        : "monthly";

    // YEARLY ACTIVE → HARD BLOCK EVERYTHING
    if (existingPlan === "yearly") {
      return res.status(409).json({
        ok: false,
        code: "SUB_ACTIVE_YEARLY",
        proUntil: sub.current_period_end,
      });
    }

    // MONTHLY ACTIVE
    if (existingPlan === "monthly") {
      // Trying monthly again → block
      if (isMonthly) {
        return res.status(409).json({
          ok: false,
          code: "SUB_ACTIVE_MONTHLY",
          proUntil: sub.current_period_end,
        });
      }

      // Monthly → Yearly upgrade
      if (isYearly) {
        try {
          await paddleRequest(
            `/subscriptions/${sub.paddle_subscription_id}`,
            "PATCH",
            {
              items: [
                {
                  price_id: process.env.PADDLE_PRICE_YEARLY,
                  quantity: 1,
                },
              ],
              proration_billing_mode:
                sub.status === "trialing"
                  ? "do_not_bill"
                  : "prorated_immediately",
            }
          );

          await sql`
            update subscription
            set price_id = ${process.env.PADDLE_PRICE_YEARLY}
            where id = ${sub.id}
          `;

          return res.json({ ok: true, upgraded: true });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ ok: false });
        }
      }
    }
  }

  // ------------------------------------------------
  // 2️⃣ CREATE NEW CHECKOUT (ONLY IF NO ACTIVE SUB)
  // ------------------------------------------------

  try {
    const checkout = await paddleRequest("/transactions", "POST", {
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
      customer: {
        email,
      },
    });

    return res.json({
      ok: true,
      checkoutUrl: checkout.data.checkout.url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false });
  }
}
