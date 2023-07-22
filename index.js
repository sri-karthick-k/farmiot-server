const express = require("express")
const app = express();
const cors = require("cors");
const pool = require("./dbConnect")
const jwt = require('jsonwebtoken')

const secretKey = process.env.AUTH_KEY;

app.use(cors())
app.use(express.json())

// Middleware to authenticate JWT tokens
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
  

app.get("/api/test", async(req, res)=>{
    let msg = [{success: "Successful API request"}, {failure: "Failed API request!"}]
    try{
        return res.status(200).send("Hello")
    } catch(err){
        return res.sendStatus(500)
    }
})

app.post("/api/login", async(req, res)=>{
    try {
        const {email, password} = req.body
        const result = await pool.query("SELECT uid FROM user_details WHERE email=($1) AND password=($2)", [email, password])
        console.log("Hello");
        const user = result.rows[0];
        if(user){
            if(email == "admin@mail.com")
                result.rows[0].type = "admin"
            const token = jwt.sign({ id: user.uid, useremail: user.email }, secretKey);
            return res.send(token)
        }
        return res.sendStatus(404);
    } catch (err) {
        return res.status(500).send(err.message);
    }
})

app.get('/api/authenticate', authenticateJWT, (req, res) => {
    res.json({ message: 'Valid User 👍' });
  });

app.post("/api/add-tenant", async(req, res)=> {
    try{
        const {name, email, password, address, company, mobile, adminid} = req.body;
        // Should add company, date_of_register
        const result = await pool.query("SELECT name FROM user_details WHERE email=($1)", [email]) 
        if(result.length > 0){
            return res.status(300).send("Email already exists!!");
        } else {
        //     Insert Statement for admin to tenant
        const result2 = await pool.query("INSERT INTO user_details(name, email, password, address, mobile) VALUES ($1, $2, $3, $4, $5) RETURNING uid", [name, email, password, address, mobile]);

        const result3 = await pool.query("INSERT INTO user_role_management(uid, admin_id, role) VALUES($1, $2, $3)", [result2.rows[0].uid, adminid, "tenant"])

        return res.status(200).send(result2.rows[0].uid)
        }
    } catch (err){
        return res.status(500).send(err.message)
    }
})

app.post("/api/add-user", async(req, res)=> {
    try{
        const {name, email, password, address, mobile, adminid} = req.body;
        // Should add company, date_of_register
        const result = await pool.query("SELECT name FROM user_details WHERE email=($1)", [email]) 
        if(result.length > 0){
            return res.status(300).send("Email already exists!!");
        } else {
        //     Insert Statement for admin & tenant to user
        const result2 = await pool.query("INSERT INTO user_details(name, email, password, address, mobile) VALUES ($1, $2, $3, $4, $5) RETURNING uid", [name, email, password, address, mobile]);

        const result3 = await pool.query("INSERT INTO user_role_management(uid, admin_id, role) VALUES($1, $2, $3)", [result2.rows[0].uid, adminid, "user"])

        return res.status(200).send(result2.rows[0].uid)
        }
    } catch (err){
        return res.status(500).send(err.message)
    }
})




app.listen("4001", () => {
    console.log("Server running at 4001")
})