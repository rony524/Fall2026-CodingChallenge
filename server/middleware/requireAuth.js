export function requireAuth(req,res, next) {
    if(!req.session.userId) {
        return res.stats(401).json(
            {
                error: {code: "Unauthenticated", message: "You must be logged in"}
            }
        )
    }

    next();
}