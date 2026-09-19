/**
 * Loads server/seed.sql (a few mock users) into the database from DATABASE_URL.
 * Run it from the project root with `npm run seed`. It's safe to run repeatedly:
 * usernames that already exist are skipped, not duplicated.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

// Resolve seed.sql next to this file so it works no matter where the command is run from
const sql = readFileSync(fileURLToPath(new URL("./seed.sql", import.meta.url)), "utf8");

try {
    const result = await pool.query(sql);
    console.log(`Seed complete: ${result.rowCount} new user(s) inserted (existing usernames are skipped).`);
} finally {
    // Close the pool so the script exits instead of hanging on open connections
    await pool.end();
}
