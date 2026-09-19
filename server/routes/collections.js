/**
 * Collection routes, mounted at /api/collections. In every path, `:id` is a collection_id.
 *
 *   GET    /                            collections you own or collaborate on
 *   POST   /                            create a collection
 *   GET    /:id/images                  photos in a collection
 *   POST   /:id/images                  add a photo            (owner or editor)
 *   DELETE /:id/images/:imageId         remove a photo         (owner or editor)
 *   GET    /:id/collaborators           who has access, and as what
 *   POST   /:id/collaborators           invite someone by username   (owner only)
 *   PATCH  /:id/collaborators/:userId   change someone's role        (owner only)
 *   DELETE /:id/collaborators/:userId   remove someone (or leave)    (owner, or yourself)
 *
 * Who can do what depends on your role in the collection:
 *   owner   - created it (collections.owner_id); full control, including collaborators
 *   editor  - a collaborator who can add and remove photos
 *   viewer  - a collaborator who can only look
 * The owner is not stored in collection_collaborators; the other two roles are.
 * Anyone (even logged out) can see the photos of a *public* collection; private ones
 * need one of the roles above.
 */
import { Router} from "express";
import { pool} from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { notifyCollectionMembers} from "./notifications.js";


export const collectionsRouter = new Router();

// Can this user change the collection's photos? True for the owner and for editors.
// (Two queries UNIONed: one checks ownership, the other looks for an 'editor' collaborator row.)
async function canEdit(collection_id, user_id) {
    const result = await pool.query(
        `SELECT collection_id, owner_id
         FROM collections
         WHERE collection_id = $1 AND owner_id = $2
         UNION
         SELECT collection_id, user_id
         FROM collection_collaborators
         WHERE collection_id = $1 AND user_id = $2 AND role = 'editor'`, [collection_id,user_id]
    )

    return result.rows.length > 0;
}

// Can this user see a private collection? True for the owner and for collaborators of
// any role, including viewers.
async function canView(collection_id, user_id) {
    const result = await pool.query(
        `SELECT 1 FROM collections WHERE collection_id = $1 AND owner_id = $2
         UNION
         SELECT 1 FROM collection_collaborators WHERE collection_id = $1 AND user_id = $2`, [collection_id,user_id]
    )

    return result.rows.length > 0;
}

// Returns the owner's user_id for a collection, or undefined if the collection doesn't exist.
// Lets a route tell "collection not found" (404) apart from "not allowed" (403).
async function getOwnerId(collection_id) {
    const result = await pool.query(
        `SELECT owner_id FROM collections WHERE collection_id = $1`, [collection_id]
    )

    return result.rows[0]?.owner_id;
}

// GET /api/collections - every collection the logged-in user owns or collaborates on.
// Besides the collection's own columns, each row carries what the cards need:
//   my_role      'owner', or the user's collaborator role ('editor' / 'viewer')
//   image_count  how many photos it holds
//   cover_url    the newest photo's url (null when empty)
// The LEFT JOIN is limited to *this user's* collaborator row, so a collection with many
// collaborators still comes back as a single row.
collectionsRouter.get("/", requireAuth, async (req,res) => {
    const result = await pool.query(
        `SELECT c.collection_id, c.name, c.description, c.is_public, c.owner_id, c.created_at,
                CASE WHEN c.owner_id = $1 THEN 'owner' ELSE cc.role END AS my_role,
                (SELECT COUNT(*)::int FROM collection_images ci WHERE ci.collection_id = c.collection_id) AS image_count,
                (SELECT i.url FROM collection_images ci JOIN images i ON i.image_id = ci.image_id
                 WHERE ci.collection_id = c.collection_id ORDER BY ci.added_at DESC LIMIT 1) AS cover_url
         FROM collections c
         LEFT JOIN collection_collaborators cc ON cc.collection_id = c.collection_id AND cc.user_id = $1
         WHERE c.owner_id = $1 OR cc.user_id = $1
         ORDER BY c.created_at DESC`, [req.session.userId]
    );
    const collections = result.rows;
    return res.status(200).json(collections);
})

// POST /api/collections - create a collection owned by the logged-in user.
// Body: { name, description?, isPublic? }. Collections are private unless isPublic is true.
collectionsRouter.post("/", requireAuth, async (req, res) => {
    const {name, description , isPublic} = req.body;

    if (!name) {
        return res.status(400).json(
            {error: {code: "VALIDATION_ERROR", message: "name is required"}}
        )
    };

    const result = await pool.query(
        `INSERT INTO collections(owner_id, name, description, is_public) VALUES ($1,$2,$3,$4) RETURNING collection_id, name, description, is_public, owner_id, created_at`, [req.session.userId, name , description ?? null, Boolean(isPublic)]
    )

    return res.status(201).json(result.rows[0]);
})


// GET /api/collections/:id/images - the photos in a collection, newest-added first.
// No requireAuth here on purpose: public collections can be viewed by anyone. For private
// ones we check by hand, answering 401 if logged out and 403 if logged in without access.
collectionsRouter.get("/:id/images", async (req,res) => {
    const collectionsResult = await pool.query(
        `SELECT owner_id, is_public FROM collections WHERE collection_id =$1`, [req.params.id]
    );
    
    const collection = collectionsResult.rows[0];
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
        if(!(await canView(req.params.id, req.session.userId))) {
            return res.status(403).json({
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

// POST /api/collections/:id/images - add an existing photo to a collection. Body: { imageId }.
// Adding a photo that's already there is harmless (ON CONFLICT DO NOTHING), and the other
// members are notified about the addition.
collectionsRouter.post("/:id/images", requireAuth, async (req, res) => {
  const { imageId } = req.body;

  if (!imageId) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "imageId is required" } });
  }

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

// DELETE /api/collections/:id/images/:imageId - take a photo out of a collection.
// This only removes the link; the photo itself stays in the feed and in other collections.
collectionsRouter.delete("/:id/images/:imageId", requireAuth, async (req, res) => {
    if(!(await canEdit(req.params.id, req.session.userId))) {
            return res.status(403).json({
                error: {code: "FORBIDDEN" , message: "You don't have access to this collection"}
            })
        }
    await pool.query(
        `DELETE FROM collection_images WHERE collection_id = $1 AND image_id = $2`, [req.params.id, req.params.imageId]
    );

    await notifyCollectionMembers(req.params.id, req.session.userId, "An image has been deleted from your collection")
    return res.status(204).send();
    
})

// POST /api/collections/:id/collaborators - invite a user by username (owner only).
// Body: { username, role? } where role is "editor" (default) or "viewer".
// Inviting someone who is already a collaborator just updates their role.
collectionsRouter.post("/:id/collaborators", requireAuth, async (req,res) => {
    const { username, role = "editor"} = req.body;

    const ownerCheck = await pool.query( `SELECT owner_id FROM collections WHERE collection_id = $1`, [req.params.id]);

    if(!ownerCheck.rows[0]) {
        return res.status(404).json({
            error: {code: "NOT_FOUND", message: "Collection not found"}
        })
    }

    if(ownerCheck.rows[0].owner_id !== req.session.userId) {
        return res.status(403).json({
            error: {code: "FORBIDDEN", message: "Only the owner can add collaborators"}
        })
    }

    if(!username || !["editor", "viewer"].includes(role)) {
        return res.status(400).json({
            error: {code: "VALIDATION_ERROR", message: "username and a role of editor or viewer are required"}
        })
    }

    const userResult = await pool.query(
        `SELECT user_id FROM users WHERE username = $1`, [username]
    );

    const invitedUser = userResult.rows[0];

    if(!invitedUser) {
        return res.status(404).json(
            {error: {code: "NOT_FOUND", message: "Invited user not found"}}
        )
    };

    // The owner already has full access and isn't kept in the collaborators table
    if(invitedUser.user_id === ownerCheck.rows[0].owner_id) {
        return res.status(400).json(
            {error: {code: "VALIDATION_ERROR", message: "The owner already has full access"}}
        )
    }

    await pool.query(
        `INSERT INTO collection_collaborators (collection_id, user_id, role )
        VALUES ($1,$2,$3)
        ON CONFLICT (collection_id, user_id) DO UPDATE SET role = EXCLUDED.role`, [req.params.id, invitedUser.user_id, role]
    )

    await pool.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1,$2)`, [invitedUser.user_id, "You were added to a collection"]
    )

    res.status(201).json({collection_id: req.params.id, user_id: invitedUser.user_id, role})
})

// GET /api/collections/:id/collaborators - everyone with access, for the modal's People tab.
// Only members can see this list. The owner comes first with role "owner"; the rest follow
// alphabetically by username.
collectionsRouter.get("/:id/collaborators", requireAuth, async (req, res) => {
    if((await getOwnerId(req.params.id)) === undefined) {
        return res.status(404).json(
            {error: {code: "NOT_FOUND", message: "Collection not found"}}
        )
    }

    if(!(await canView(req.params.id, req.session.userId))) {
        return res.status(403).json({
            error: {code: "FORBIDDEN", message: "You don't have access to this collection"}
        })
    }

    // The owner and the collaborators live in different tables, so stack them with UNION ALL
    // and wrap the result in a subquery so ORDER BY can use the combined `role` column.
    const result = await pool.query(
        `SELECT user_id, username, firstname, lastname, role FROM (
            SELECT u.user_id, u.username, u.firstname, u.lastname, 'owner' AS role
            FROM collections c JOIN users u ON u.user_id = c.owner_id
            WHERE c.collection_id = $1
            UNION ALL
            SELECT u.user_id, u.username, u.firstname, u.lastname, cc.role
            FROM collection_collaborators cc JOIN users u ON u.user_id = cc.user_id
            WHERE cc.collection_id = $1
         ) members
         ORDER BY (role = 'owner') DESC, username`, [req.params.id]
    );

    return res.status(200).json(result.rows);
})

// PATCH /api/collections/:id/collaborators/:userId - change a collaborator's role (owner only).
// Body: { role: "editor" | "viewer" }. The affected user is notified.
collectionsRouter.patch("/:id/collaborators/:userId", requireAuth, async (req, res) => {
    const { role } = req.body;
    const ownerId = await getOwnerId(req.params.id);

    if(ownerId === undefined) {
        return res.status(404).json(
            {error: {code: "NOT_FOUND", message: "Collection not found"}}
        )
    }

    if(ownerId !== req.session.userId) {
        return res.status(403).json({
            error: {code: "FORBIDDEN", message: "Only the owner can change roles"}
        })
    }

    if(!["editor", "viewer"].includes(role)) {
        return res.status(400).json({
            error: {code: "VALIDATION_ERROR", message: "role must be editor or viewer"}
        })
    }

    const result = await pool.query(
        `UPDATE collection_collaborators SET role = $3 WHERE collection_id = $1 AND user_id = $2 RETURNING user_id, role`,
        [req.params.id, req.params.userId, role]
    )

    if(!result.rows[0]) {
        return res.status(404).json(
            {error: {code: "NOT_FOUND", message: "Collaborator not found"}}
        )
    }

    await pool.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1,$2)`, [result.rows[0].user_id, `Your role in a collection was changed to ${role}`]
    )

    return res.status(200).json(result.rows[0])
})

// DELETE /api/collections/:id/collaborators/:userId - remove a collaborator.
// The owner can remove anyone; any collaborator can remove themselves ("Leave").
// The owner can't be removed this way, since they aren't in the collaborators table (404).
collectionsRouter.delete("/:id/collaborators/:userId", requireAuth, async (req, res) => {
    const ownerId = await getOwnerId(req.params.id);

    if(ownerId === undefined) {
        return res.status(404).json(
            {error: {code: "NOT_FOUND", message: "Collection not found"}}
        )
    }

    // route params are strings, session ids are numbers, hence Number()
    const isSelf = Number(req.params.userId) === req.session.userId;

    if(ownerId !== req.session.userId && !isSelf) {
        return res.status(403).json({
            error: {code: "FORBIDDEN", message: "Only the owner can remove other collaborators"}
        })
    }

    const result = await pool.query(
        `DELETE FROM collection_collaborators WHERE collection_id = $1 AND user_id = $2 RETURNING user_id`,
        [req.params.id, req.params.userId]
    )

    if(!result.rows[0]) {
        return res.status(404).json(
            {error: {code: "NOT_FOUND", message: "Collaborator not found"}}
        )
    }

    // Tell the person they were removed, but not someone who chose to leave
    if(!isSelf) {
        await pool.query(
            `INSERT INTO notifications (user_id, message) VALUES ($1,$2)`, [result.rows[0].user_id, "You were removed from a collection"]
        )
    }

    return res.status(204).send()
})