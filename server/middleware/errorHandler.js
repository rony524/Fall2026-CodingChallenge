// eslint-disable-next-line no-unused-vars -- Express only treats a 4-argument function as an error handler
export function errorHandler(err, req, res, next) {
    console.error(err);
    res.status(500).json(
        {error: {code: "SERVER_ERROR", message: "Something went wrong"}}
    );
}
