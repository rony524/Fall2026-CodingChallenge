/**
 * PixShare API server (Express 5).
 *
 * Start it from the project root with `npm run server`. Everything lives under /api:
 *
 *   /api/health           liveness check
 *   /api/auth/*           signup, login, logout, current user
 *   /api/images/*         the photo feed and uploads
 *   /api/collections/*    collections, the photos in them, and their collaborators
 *   /api/notifications/*  a user's notifications
 *
 * Express 5 forwards errors thrown (or rejected) inside async route handlers to the
 * error handler registered at the bottom, so routes don't need their own try/catch.
 */
import express from "express";
import cors from "cors";
import session from "express-session";

// Load server/.env first so process.env is populated before the routes import db.js
import "./env.js";


import { authRouter} from "./routes/auth.js";
import { collectionsRouter} from "./routes/collections.js";
import { imagesRouter } from "./routes/images.js";
import { notificationsRouter} from "./routes/notifications.js";
import { errorHandler} from "./middleware/errorHandler.js";


const app = express();

// Origin of the Vite dev server (the browser app that calls this API).
// `credentials: true` lets the browser send and accept the session cookie on
// cross-origin requests; the client's fetch calls opt in with `credentials: "include"`.
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173", credentials: true }));

// Parse JSON request bodies into req.body
app.use(express.json());

// Login state. After a successful login the routes store the user id in req.session;
// the cookie below is how the browser proves which session is theirs on later requests.
//   resave: false             - don't re-save a session that hasn't changed
//   saveUninitialized: false  - don't create a session (or cookie) for visitors who never log in
//   maxAge                    - stay signed in for 7 days
// Sessions are held in server memory (express-session's default store), so everyone is
// signed out when the server restarts. Use a persistent store before deploying for real.
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 1000 * 60 * 60 * 24 * 7},
    })
)

// Cheap endpoint for checking that the server is up (no auth, no database)
app.get("/api/health", async (req,res) =>  res.status(200).json({ status: "ok"}))

app.use("/api/auth",authRouter);
app.use("/api/images", imagesRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/notifications", notificationsRouter);


// Must be registered after all routes so it catches errors from any of them
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {console.log(`API running on http://localhost:${PORT}`)});

