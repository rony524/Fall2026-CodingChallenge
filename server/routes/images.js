/**
 * Photo routes, mounted at /api/images.
 *
 *   GET    /       the photo feed (public)
 *   POST   /       add a photo (login required)
 *   DELETE /:id    delete one of your own photos (login required)
 *
 * A "photo" is a link to an image hosted somewhere else (url + caption); no file is
 * stored on this server.
 *
 * Columns are renamed in the SELECT/RETURNING (`image_id AS id`, `user_id AS owner_id`)
 * so the JSON matches the shape the client's ImageRecord type expects.
 */
import { Router} from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const imagesRouter = new Router();

// GET /api/images - up to 40 photos for the Discover feed, ordered by created_at (oldest first)
imagesRouter.get("/", async (req,res) => {
    const result = await pool.query(`SELECT image_id AS id, user_id AS owner_id, url, created_at, caption FROM images ORDER BY created_at LIMIT 40`);

    return res.status(200).json(result.rows);
})

// POST /api/images - add a photo owned by the logged-in user
imagesRouter.post("/", requireAuth, async (req,res) => {
    const {url, caption} = req.body;

   if (!url || !caption) {
        return res.status(400).json({error: {code: "VALIDATION_ERROR", message: "url and caption are required"}})
    }
    const result = await pool.query(`INSERT INTO images(user_id, url, caption) VALUES ($1,$2,$3) RETURNING image_id AS id, user_id AS owner_id, url, created_at, caption`, [req.session.userId, url, caption]);

    res.status(201).json(result.rows[0])
})

// DELETE /api/images/:id - the WHERE clause includes user_id, so you can only delete
// your own photos; someone else's id simply matches nothing and gets a 404.
// The photo is also removed from any collection that contained it (ON DELETE CASCADE
// on collection_images); the collections themselves are untouched.
imagesRouter.delete("/:id", requireAuth, async (req,res) => {
    const result = await pool.query(`DELETE FROM images WHERE image_id=$1 AND user_id=$2 RETURNING image_id`, [req.params.id, req.session.userId]);

    if(result.rows.length === 0) {
        return res.status(404).json({error: {code: "NOT_FOUND", message: "Image not found"}})
    }
    res.status(204).send();
})
