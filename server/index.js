import express from "express";
import cors from "cors";
import session from "express-session";

import "./env.js";


import { authRouter} from "./routes/auth.js";
import { collectionsRouter} from "./routes/collections.js";
import { imagesRouter } from "./routes/images.js";
import { notificationsRouter} from "./routes/notifications.js";
import { errorHandler} from "./middleware/errorHandler.js";


const app = express();

// Origin of the Vite dev server (the browser app that calls this API)
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173", credentials: true }));

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 1000 * 60 * 60 * 24 * 7},
    })
)

app.get("/api/health", async (req,res) =>  res.status(200).json({ status: "ok"}))

app.use("/api/auth",authRouter);
app.use("/api/images", imagesRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/notifications", notificationsRouter);


app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {console.log(`API running on http://localhost:${PORT}`)});

