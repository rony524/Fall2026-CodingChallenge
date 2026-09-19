/**
 * Route guard: put it before a route handler to require a logged-in user, e.g.
 *   router.post("/", requireAuth, async (req, res) => { ... })
 *
 * Login stores the user's id in the session (see routes/auth.js), so a missing
 * `userId` means the visitor isn't logged in. Handlers that run after this guard
 * can rely on `req.session.userId` being set.
 */
export function requireAuth(req,res, next) {
    if(!req.session.userId) {
        return res.status(401).json(
            {
                error: {code: "Unauthenticated", message: "You must be logged in"}
            }
        )
    }

    next();
}
