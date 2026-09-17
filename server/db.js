import pg from "pg";
import "dotenv/config"

const { Pool} = pg;

export const pool = new Pool({
    connectionsString: process.env.DATABASE_URL,
    ssl: {rejectedUnauthorized: false}
});