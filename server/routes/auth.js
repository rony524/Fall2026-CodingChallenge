import { Router} from "express";
import bcrypt from "bcrypt";
import { pool} from "../db.js";

const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
    const {firstName, lastName, username, password} = req.body;

    const exsisting = await pool.query(
        "SELECT user_id FROM User WHERE username =$1", [username]
    )

    if(!username || !password) {
        return res.status(400).json(
            {error: {code: "VALIDATION_ERROR", message: "Username and password are required"}}
        )
    }

    if(exsisting.rows.length > 0) {
        return res.status(409).json(
            {error: {code: "USERNAME_TAKEN", message: "That username is already in use"}}
        )
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        "INSERT INTO User (firstName, lastName, username, password)  VALUES($1,$2,$3,$4) RETURNING user_id, username, firstName, lastName", [firstName ?? null,lastName ?? null,username,password_hash]
    )

    const user = result.rows[0];

    req.session.userId = user.user_id;

    res.status(201).json(user);
})

authRouter.post("/login", async (req,res) => {
   const {username, password} = req.body;

   const result = await pool.query(
    "SELECT user_id, username, password_hash FROM USER WHERE username=$1", [username]
   )

   const user = result.rows[0];

   if(!user || !(password_hash === await bcrypt.compare(password,password_hash))) {
    return res.status(401).json(
        {error: {code: "INVALID_CREDENTIAL", message: "Incorrect username or password"}}
    )
   }

   req.session.userId = user.user_id;
   res.status(200).json({
        user_id: user.user_id, username: user.username
   });

})

authRouter.post("/logout", async (req,res) => {
    req.session.destroy(() => {
        res.status(204).send()
    });

});

authRouter.get("/me", async (req, res) => {
    if(!req.session.userId) {
        res.status(401).json(
            {error: {code: "UNAUTHENTICATED", message: "Not logged in"}}
        )
    }

    const result = pool.query(
        "SELECT user_id, firstName, lastName, username FROM User WHERE user_id=$1", [req.session.userId] 
    );
    const user = result.rows[0];

    return res.status(200).json(user);
});