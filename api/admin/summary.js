import { isAdminEmail } from "../_lib/admin.js";
import { getMeFromRequest } from "../_lib/getMe.js";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

async function getUsersSummary() {
  const rows = await sql`
    select
      count(*)::int as total,
      count(*) filter (where created_at >= now() - interval '7 days')::int as new7d,
      count(*) filter (where created_at >= now() - interval '30 days')::int as new30d
    from app_user
  `;

  const row = rows[0] || {};

  return {
    total: Number(row.total || 0),
    new7d: Number(row.new7d || 0),
    new30d: Number(row.new30d || 0),
  };
}

async function getProSummary() {
  const rows = await sql`
    with sub_flags as (
      select
        user_id,
        case
          when current_period_end > now()
           and lower(coalesce(status, '')) in ('active', 'trialing', 'past_due', 'canceled', 'cancelled')
          then true
          else false
        end as is_active
      from user_subscription
    ),
    totals as (
      select count(*)::int as total_users
      from app_user
    )
    select
      coalesce(count(*) filter (where is_active), 0)::int as active,
      coalesce(count(*) filter (where not is_active), 0)::int as expired,
      coalesce(
        round(
          (
            (count(*) filter (where is_active))::numeric
            / nullif((select total_users from totals), 0)::numeric
          ) * 100,
          1
        ),
        0
      ) as conversion_rate
    from sub_flags
  `;

  const row = rows[0] || {};

  return {
    active: Number(row.active || 0),
    expired: Number(row.expired || 0),
    conversionRate: Number(row.conversion_rate || 0),
  };
}

async function getRevenueSummary() {
  const rows = await sql`
    select
      coalesce(
        sum(amount) filter (
          where lower(coalesce(status, '')) in ('completed', 'paid')
            and occurred_at >= date_trunc('month', now())
            and upper(coalesce(currency, '')) = 'EUR'
        ),
        0
      )::numeric as month,

      coalesce(
        sum(amount) filter (
          where lower(coalesce(status, '')) in ('completed', 'paid')
            and occurred_at >= now() - interval '30 days'
            and upper(coalesce(currency, '')) = 'EUR'
        ),
        0
      )::numeric as last30d,

      coalesce(
        sum(amount) filter (
          where lower(coalesce(status, '')) in ('completed', 'paid')
            and upper(coalesce(currency, '')) = 'EUR'
        ),
        0
      )::numeric as lifetime
    from paddle_transaction
  `;

  const row = rows[0] || {};

  return {
    month: Number(row.month || 0),
    last30d: Number(row.last30d || 0),
    lifetime: Number(row.lifetime || 0),
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const me = await getMeFromRequest(req);

    const email = me?.user?.email;

    if (!email || !isAdminEmail(email)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const [users, pro, revenue] = await Promise.all([
      getUsersSummary(),
      getProSummary(),
      getRevenueSummary(),
    ]);

    return res.status(200).json({
      ok: true,
      users,
      pro,
      revenue,
    });
  } catch (err) {
    console.error("[admin/summary] failed", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
