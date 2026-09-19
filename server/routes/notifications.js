/**
 * Notification routes, mounted at /api/notifications, plus the helper other routes
 * use to create notifications for a collection's members.
 *
 *   GET   /       the logged-in user's notifications, newest first, paged
 *   PATCH /:id    mark one of your notifications as read
 *
 * Notifications are rows in the `notifications` table addressed to one user.
 */
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const notificationsRouter = new Router();

// GET /api/notifications?limit=4&offset=0
// Paged so the bell popover can show a few and offer "Load more".
// The response is { items, has_more }; has_more says whether rows exist beyond this page.
notificationsRouter.get("/", requireAuth, async (req,res) => {

    // Paging comes from the query string. Clamp it: 1-50 per page (default 4), offset >= 0.
    const limit = Math.min(Math.max(Number(req.query.limit) || 4, 1), 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const itemsResult = await pool.query(`SELECT notification_id, message, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [req.session.userId, limit, offset]);
    const countResult = await pool.query(`SELECT COUNT(notification_id) FROM notifications WHERE user_id = $1`, [req.session.userId]);

    // pg returns COUNT as a string (it's a 64-bit integer), hence the Number()
    const total = Number(countResult.rows[0].count);

    res.status(200).json({
        items: itemsResult.rows,
        has_more: offset + itemsResult.rows.length < total
    })



})

// PATCH /api/notifications/:id - mark a notification as read.
// Filtering on user_id means you can only touch your own; anything else is a 404.
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

// Sends `message` to everyone in a collection (the owner and all collaborators) except
// the person who caused the event, who doesn't need to be told about their own action.
// Used by the collection routes when photos are added or removed.
export async function notifyCollectionMembers(collectionId, actingUserId, message) {
  // UNION also removes duplicates, so nobody is notified twice
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
