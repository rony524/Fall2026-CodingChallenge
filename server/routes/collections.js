import { Router} from "express";
import { pool} from "../db.js";


const collectionsRouter = new Router();

//handles if user allowed editor permissions
async function canEdit(collection_id, user_id) {
    const result = await pool.query(
        `SELECT collection_id, user_id 
         FROM collections 
         WHERE collection_id = $1 AND user_id = $2
         UNION 
         SELECT collection_id, owner_id 
         FROM collection_collaborators
         WHERE collection_id = $1 AND owner_id = $2 AND role = 'editor'`, [collection_id,user_id]
    )

    return result.rows.length > 0;
}

//api get collections route
collectionsRouter.get("/collections", requireAuth, async (req,res) => {
    const result = await pool.query(
        `SELECT DISTINCT c.name, c.description,c.is_public,c.owner_id FROM collections c LEFT JOIN collection_collaborators cc ON cc.collection_id = c.collection_id WHERE c.owner_id = $1 OR cc.userId = $1 `, [req.session.userId]
    );
    const collections = result.rows;
    return res.status(200).json(collections);
})

//api post collections route
collectionsRouter.post("/", requireAuth, async (req, res) => {
    const {name, description , isPublic} = req.body;

    if (!name) {
        return res.status(400).json(
            {error: {code: "VALIDATION_ERROR", message: "name is required"}}
        )
    };

    const result = await pool.query(
        `INSERT INTO collections(owner_id, name, description, isPublic) VALUES ($1,$2,$3,$4)`, [req.session.userId, name , description ?? null, Boolean(isPublic)]
    )

    return res.status(201).json(result.rows[0]);
})


//api get images from collections route
collectionsRouter.get("/:id/images", async (req,res) => {
    const collectionsResult = await pool.query(
        `SELECT owner_id, is_public FROM collections WHERE collection_id =$1`, [req.params.id]
    );
    
    const collection = collectionsResult.row[0];
    if(!collection) {
        return res.status(404).json(
            {error: { code: "NOT_FOUND", message: "Collection not found"}}
        )
    }

    if(!collection.is_public) {
        if(!req.session.userId) {
            return res.status(401).json({
                error: {code: "UNAUTHENTICATED", message: "This collection is private"}
            })
        }
        const isOwner = collection.userId === req.session.userId;

        if(!isOwner && !(await canEdit(req.params.id, req.params.user_id))) {
            return res.status(400).json({
                error: {code: "FORBIDDEN" , message: "You don't have access to this collection"}
            })
        }
    }

    const result = await pool.query(
        `SELECT i.image_id, i.url, i.caption, i.user_id
        FROM collection_images ci
        JOIN images i ON i.image_id = ci.image_id
        WHERE ci.collection_id = $1
        ORDER BY ci.added_at DESC
        `, [req.params.id]
    );

    return res.status(200).json(result.rows);


})

//api post images to collections route
collectionsRouter.post("/:id/images", requireAuth, async (req, res) => {
  const { imageId } = req.body;

  if (!(await canEdit(req.params.id, req.session.userId))) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "You can't edit this collection." } });
  }


  await pool.query(
    "INSERT INTO collection_images (collection_id, image_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [req.params.id, imageId]
  );

  await notifyCollectionMembers(req.params.id, req.session.userId, "A photo was added to a collection you're part of.");

  res.status(201).json({ collectionId: req.params.id, imageId });
});

//api delete images from collections route
collectionsRouter.delete("/:id/images/:imageId", requireAuth, async (req, res) => {
    if(!(await canEdit(req.params.id, req.params.user_id))) {
            return res.status(400).json({
                error: {code: "FORBIDDEN" , message: "You don't have access to this collection"}
            })
        }
    const result = await pool.query(
        `DELETE FROM collection_images WHERE collection_id = $1 AND image_id = $2`, [req.params.id, req.params.imageId]
    );

    await notifyCollectionMembers(req.params.id,req.params.user_id, "An image has been deleted from your collection")
    return res.status(204).send();
    
})

//api post collaborators to collections route
collectionsRouter.post("/:id/collaborators", requireAuth, async (req,res) => {
    const { username, role = "editor"} = req.body;

    const ownerCheck = await pool.query( `SELECT owner_id FROM collections WHERE collection_id = $1`, [req.params.id]);

    if(!ownerCheck.rows[0]) {
        return res.status(404).json({
            error: {code: "NOT_FOUND", code: "Collection not found"}
        })
    }

    if(!ownerCheck.rows[0].owner_id === req.params.user_id) {
        return res.status(401).json({
            error: {code: "FORBIDDEN", message: "Only the owner can add collaborators"}
        })
    }

    const userResult = await pool.query(
        `SELECT user_id FROM users WHERE username = $1`, [username]
    );

    const invitedUser = result.rows[0];

    if(!invitedUser) {
        return res.status(404).json(
            {error: {code: "NOT_FOUND", message: "Invited user not found"}}
        )
    };

    await pool.query( 
        `INSERT INTO collection_collaborators (collectoin_id, user_id, role )
        VALUES ($1,$2,$3) `, [req.params.id, invitedUser.user_id, role]
    )

    await pool.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1,$2)`, [invitedUser.user_id, "Your were added to a collection"]
    )

    res.status(201).json({collection_id: req.params.id, user_id: invitedUser.user_id, role})




})