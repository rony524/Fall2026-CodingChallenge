/**
 * Authentication routes, mounted at /api/auth.
 *
 *   POST /signup   create an account and log in
 *   POST /login    log in
 *   POST /logout   log out
 *   GET  /me       who is logged in right now?
 *
 * "Logged in" means a server-side session: on success we store the user's id in
 * `req.session.userId`, and express-session gives the browser a cookie that points at
 * that session on later requests. Passwords are never stored, only bcrypt hashes.
 *
 * Note: Postgres lowercases unquoted column names, so `firstName` comes back as
 * `firstname` in query results. That is why the JSON sent to the client uses
 * `firstname` / `lastname`.
 */
import { Router} from "express";
import bcrypt from "bcrypt";
import { pool} from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

// POST /api/auth/signup - create an account, then log the new user in straight away
authRouter.post("/signup", async (req, res) => {
    const {firstName, lastName, username, password} = req.body;

    if(!username || !password) {
        return res.status(400).json(
            {error: {code: "VALIDATION_ERROR", message: "Username and password are required"}}
        )
    }

    // Friendly 409 for the common case. (The UNIQUE constraint on users.username is the
    // real guarantee if two signups with the same name arrive at the same moment.)
    const exsisting = await pool.query(
        `SELECT user_id FROM users WHERE username =$1`, [username]
    )

    if(exsisting.rows.length > 0) {
        return res.status(409).json(
            {error: {code: "USERNAME_TAKEN", message: "That username is already in use"}}
        )
    }

    // 10 = bcrypt cost factor. The salt is generated for us and stored inside the hash.
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users (firstName, lastName, username, password_hash)  VALUES($1,$2,$3,$4) RETURNING user_id, username, firstName, lastName`, [firstName ?? null,lastName ?? null,username,password_hash]
    )

    const user = result.rows[0];

    req.session.userId = user.user_id;

    res.status(201).json(user);
})

// POST /api/auth/login - check the password and start a session
authRouter.post("/login", async (req,res) => {
   const {username, password} = req.body;

   if(!username || !password) {
    return res.status(400).json(
        {error: {code: "VALIDATION_ERROR", message: "Username and password are required"}}
    )
   }

   const result = await pool.query(
    `SELECT user_id, username, firstName, lastName, password_hash FROM users WHERE username=$1`, [username]
   )

   const user = result.rows[0];

   // Unknown username and wrong password get the same answer on purpose, so the
   // response can't be used to find out which usernames exist.
   // bcrypt.compare re-hashes the attempt using the salt stored in the saved hash.
   if(!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json(
        {error: {code: "INVALID_CREDENTIAL", message: "Incorrect username or password"}}
    )
   }

   req.session.userId = user.user_id;
   // Never send password_hash back: pick the public fields explicitly
   res.status(200).json({
        user_id: user.user_id, username: user.username, firstname: user.firstname, lastname: user.lastname
   });

})

// POST /api/auth/logout - end the session (the cookie then points at nothing)
authRouter.post("/logout", async (req,res) => {
    req.session.destroy(() => {
        res.status(204).send()
    });

});

// GET /api/auth/me - the logged-in user, or 401 if nobody is.
// The client calls this on page load to restore the session after a refresh.
authRouter.get("/me", async (req, res) => {
    if(!req.session.userId) {
       return res.status(401).json(
            {error: {code: "UNAUTHENTICATED", message: "Not logged in"}}
        )
    }

    const result = await pool.query(
        `SELECT user_id, firstName, lastName, username FROM users WHERE user_id=$1`, [req.session.userId]
    );
    const user = result.rows[0];

    return res.status(200).json(user);
});
