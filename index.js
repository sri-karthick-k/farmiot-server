const express = require("express")
const app = express();
const cors = require("cors");
const pool = require("./dbConnect")

// app.use(cors)
// app.use(express.json())

app.get("/test", async(req, res)=>{
    let msg = [{success: "Successful API request"}, {failure: "Failed API request!"}]
    try{
        console.log("Hello")
        return res.sendStatus(200)
    } catch(err){
        console.log("olleH")
        return res.sendStatus(500)
    }
})

app.get("/acc", async(req, res)=> {
    try{
        const result = await pool.query("SELECT * FROM ACCOUNTS")
        return res.json(result.rows)
    } catch(err) {
        console.error(err.message)
        return res.sendStatus(500)
    }
})



app.listen("4001", () => {
    console.log("Server running at 4001")
})