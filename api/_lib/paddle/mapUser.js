export async function mapUser({ sql, customerId, userId }) {
  if (customerId) {
    const rows = await sql`
      select id, email, tier, paddle_customer_id
      from app_user
      where paddle_customer_id = ${customerId}
      limit 1
    `;
    if (rows[0]) return rows[0];
  }

  if (userId) {
    const rows = await sql`
      select id, email, tier, paddle_customer_id
      from app_user
      where id = ${userId}
      limit 1
    `;
    const user = rows[0] || null;

    if (user && customerId) {
      await sql`
        update app_user
        set paddle_customer_id = ${customerId}
        where id = ${user.id} and paddle_customer_id is null
      `;

      return {
        ...user,
        paddle_customer_id: user.paddle_customer_id || customerId,
      };
    }

    return user;
  }

  return null;
}
