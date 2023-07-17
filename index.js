const express = require("express")
const app = express();
const cors = require("cors");
const pool = require("./dbConnect")

// app.use(cors)
// app.use(express.json())

app.get("/api/test", async(req, res)=>{
    let msg = [{success: "Successful API request"}, {failure: "Failed API request!"}]
    try{
        return res.status(200).send("Hello")
    } catch(err){
        return res.sendStatus(500)
    }
})

app.get("/api/acc", async(req, res)=> {
    try{
        const result = await pool.query("SELECT * FROM ACCOUNTS")
        return res.json(result.rows)
    } catch(err) {
        return res.sendStatus(500)
    }
})


app.get("/api/add-user", async(req, res)=> {
    try{
        const result = await pool.query("SELECT * FROM user_role_management WHERE uid=(%s) AND role='admin'");
        if(result.length <= 0){
            return res.sendStatus(404);
        } else {
        //     Insert Statement for admin to tenant
        }
    } catch (err){
        return res.sendStatus(500)
    }
})



app.listen("4001", () => {
    console.log("Server running at 4001")
})