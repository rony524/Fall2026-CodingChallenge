/**
 * Shared PostgreSQL connection pool (hosted on Supabase).
 *
 * Every route imports `pool` from here and calls `pool.query(sql, [values])`.
 * Always pass user input as values ($1, $2, ...) rather than building it into the
 * SQL string, so it can never be interpreted as SQL (SQL injection).
 */
import pg from "pg";
import "./env.js"; // must run first so DATABASE_URL is set before the Pool below is created

// `pg` is a CommonJS package, so Pool is taken from its default export
const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // The connection is still encrypted, but Node is told not to verify who signed the
    // server's certificate (hosted poolers like Supabase's use a certificate Node doesn't
    // trust by default). Fine for development; for production, pass the provider's CA
    // certificate here instead of turning verification off.
    ssl: { rejectUnauthorized: false }
});
