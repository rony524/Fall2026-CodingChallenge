import { Router} from "express";
import bcrypt from "bcrypt";
import { pool} from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

//api post signup route
authRouter.post("/signup", async (req, res) => {
    const {firstName, lastName, username, password} = req.body;

    if(!username || !password) {
        return res.status(400).json(
            {error: {code: "VALIDATION_ERROR", message: "Username and password are required"}}
        )
    }

    const exsisting = await pool.query(
        `SELECT user_id FROM users WHERE username =$1`, [username]
    )

    if(exsisting.rows.length > 0) {
        return res.status(409).json(
            {error: {code: "USERNAME_TAKEN", message: "That username is already in use"}}
        )
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users (firstName, lastName, username, password_hash)  VALUES($1,$2,$3,$4) RETURNING user_id, username, firstName, lastName`, [firstName ?? null,lastName ?? null,username,password_hash]
    )

    const user = result.rows[0];

    req.session.userId = user.user_id;

    res.status(201).json(user);
})

//api post login route
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

   if(!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json(
        {error: {code: "INVALID_CREDENTIAL", message: "Incorrect username or password"}}
    )
   }

   req.session.userId = user.user_id;
   res.status(200).json({
        user_id: user.user_id, username: user.username, firstname: user.firstname, lastname: user.lastname
   });

})

//api post logout route
authRouter.post("/logout", async (req,res) => {
    req.session.destroy(() => {
        res.status(204).send()
    });

});

//api get current user route
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