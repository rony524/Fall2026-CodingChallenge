import { Router } from "express";
import { pool } from "../db.js";

const notificationsRouter = new Router();

notificationsRouter.get("/", requireAuth, async (req,res) => {

    const limit = Math.min((Number(req.params.limit)) || 4, 50);
    const offset = Number(req.params.offset) || 0;

    const itemsResult = await pool.query(`SELECT notification_id, message, is_read, created_at FROM Notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT = $2 OFFSET = $3`, [req.session.userId, limit, offset]);

    const countResult = await pool.query(`SELECT COUNT(notification_id) FROM Notifications WHERE user_id = $1`, [req.session.userId]);

    const total = Number(countResult.rows[0].count);

    res.status(200).json({
        items: itemsResult.rows,
        hasMore: offset + itemsResult.rows.length < total
    })


    
})

notificationsRouter.patch("/:id", requireAuth, async (req, res) => {
  const result = await pool.query(
    "UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2 RETURNING notification_id",
    [req.params.id, req.session.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found." } });
  }

  res.status(204).send();
});

export async function notifyCollectionMembers(collectionId, actingUserId, message) {
  const result = await pool.query(
    `SELECT owner_id AS user_id FROM collections WHERE collection_id = $1
     UNION
     SELECT user_id FROM collection_collaborators WHERE collection_id = $1`,
    [collectionId]
  );

  const recipients = result.rows.map((row) => row.user_id).filter((userId) => userId !== actingUserId);

  for (const userId of recipients) {
    await pool.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [userId, message]);
  }
}