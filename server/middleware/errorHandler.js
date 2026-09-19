/**
 * Last-resort error handler, registered after all routes in index.js.
 *
 * Any error thrown inside a route (a failed query, a bug) ends up here. The full
 * error is logged on the server, but the client only gets a generic message so
 * internal details (SQL, stack traces) are never leaked.
 */
// eslint-disable-next-line no-unused-vars -- Express only treats a 4-argument function as an error handler
export function errorHandler(err, req, res, next) {
    console.error(err);
    // No next() call here: the response is finished, and calling it would push the
    // request on to Express's default handler after we've already replied.
    res.status(500).json(
        {error: {code: "SERVER_ERROR", message: "Something went wrong"}}
    );
}
