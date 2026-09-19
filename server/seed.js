// Loads server/seed.sql (mock users) into the database from DATABASE_URL.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const sql = readFileSync(fileURLToPath(new URL("./seed.sql", import.meta.url)), "utf8");

try {
    const result = await pool.query(sql);
    console.log(`Seed complete: ${result.rowCount} new user(s) inserted (existing usernames are skipped).`);
} finally {
    await pool.end();
}
