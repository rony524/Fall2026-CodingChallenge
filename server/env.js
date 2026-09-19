// Load server/.env no matter which directory the server is started from.
// Import this before anything that reads process.env.
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });
