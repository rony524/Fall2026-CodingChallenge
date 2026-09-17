import { Router} from "express";
import { pool } from "../db.js";


const imagesRouter = new Router();


imagesRouter.get("/images", async (req,res) => {
    const result = await pool.query(`SELECT image_id, user_id, url, created_at, caption FROM Images ORDER BY created_at LIMIT 40`);

    return res.status(200).json(result.rows);
})

imagesRouter.post("/", requireAuth, async (req,res) => {
    const {url, caption} = req.body;

   if (!url || !caption) {
        return res.status(400).json({error: {code: "VALIDATION_ERROR", message: "url and caption are required"}})
    }
    const result = await pool.query(`INSERT INTO Images(user_id, url, caption) VALUES ($1,$2,$3) RETURNING *`, [req.session.userId, url, caption]);

    res.status(201).json(result.rows[0])
})

imagesRouter.delete("/:id", requireAuth, async (req,res) => {
    const result = await pool.query(`DELETE FROM Images WHERE image_id=$1 AND user_id=$2 RETURNING image_id`, [req.params.id, req.session.userId]);

    if(result.rows[0].length === 0) {
        return res.status(404).json({error: {code: "NOT_FOUND", message: "Image not found"}})
    }
    res.status(204).send();
})