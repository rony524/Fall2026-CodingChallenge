import express from "express";
import cors from "cors";
import session from "express-session";

import "dotenv/config"

import { authRouter} from "./routes/auth.js";
import { collectionRouter} from "./routes/collections.js";
import { imagesRouter } from "./routes/images";
import { notificationsRouter} from "./routes/notifications.js";
import { errorhandler} from "./middleware/errorHandler.js";


const app = express();

app.use(cors({ origin: "https://localhost:3000", credentials: true }));

app.use(express.json());

app.use(
    session({
        session: SESSION_SECRET,
        resave: false,
        saveUninstalled: false,
        cookie: {maxAge: 1000 * 60 * 60 * 24* 7},
    })
)

app.get('/api/health', async (req,res) =>  res.status(200).json({ status: "ok"}))

app.use("/api/auth",authRouter);
app.use("/api/images", imagesRouter);
app.use("/api/collections", collectionRouter);
app.use("/api/notifications", notificationsRouter);


app.use(errorhandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {console.log(`API running on "https://localhost:${PORT}`)});

