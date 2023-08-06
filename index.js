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


app.get("/api/test", async (req, res) => {
    let msg = [{ success: "Successful API request" }, { failure: "Failed API request!" }]
    try {
        return res.status(200).send("Hello")
    } catch (err) {
        return res.sendStatus(500)
    }
})

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body
        const result = await pool.query("SELECT uid FROM user_details WHERE email=($1) AND password=($2)", [email, password])
        console.log("Hello");
        const user = result.rows[0];
        if (user) {
            if (email == "admin@mail.com")
                result.rows[0].type = "admin"
            const token = jwt.sign({ id: user.uid, useremail: user.email }, secretKey);
            return res.send(token)
        }
        return res.sendStatus(404);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

app.get('/api/authenticate', authenticateJWT, (req, res) => {
    res.json({ message: 'Valid User 👍' });
});

app.post("/api/add-tenant-user", async (req, res) => {
    try {
        const { name, email, password, address, company, mobile, adminid, role = "user" } = req.body;
        // Should add company, date_of_register
        const result = await pool.query("SELECT name FROM user_details WHERE email=($1)", [email])
        if (result.rowCount > 0) {
            return res.status(300).json({ emailExist: "Email already exists!!" });
        } else {

            const isValidAdminId = await pool.query("SELECT uid FROM user_details WHERE uid=($1)", [adminid])
            
            if (isValidAdminId.rowCount > 0) {
                //     Insert Statement for admin to tenant
                const result2 = await pool.query("INSERT INTO user_details(name, email, password, address, mobile) VALUES ($1, $2, $3, $4, $5) RETURNING uid", [name, email, password, address, mobile]);

                const result3 = await pool.query("INSERT INTO user_role_management(uid, admin_id, role) VALUES($1, $2, $3)", [result2.rows[0].uid, adminid, role])

                return res.status(200).json({ uid: result2.rows[0].uid });
            } else {
                return res.status(300).json({ invalidAdminId: "AdminID not Present...Record Not Inserted" });
            }
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})


// Will not work unless add-device route is present (try hard coding values into database for adding device)
app.post("/api/add-sensor-parameter", async(req, res)=>{
    try {
        const { device_id, sensor_id, key, minValue, maxValue, siunit, uid } = req.body;
        // Should add company, date_of_register
        const result = await pool.query("SELECT device_id FROM device_management WHERE device_id=($1)", [device_id])
        if (result.rowCount > 0) {
            const isValidUserId = await pool.query("SELECT uid FROM user_details WHERE uid=($1)", [uid])

            if (isValidUserId.rowCount > 0) {
                //     Insert Statement Sensor parameters only if both user and device_id is valid
                const result2 = await pool.query("INSERT INTO sensor_parameters(device_id, sensor_id, key, minValue, maxValue, siunit) VALUES ($1, $2, $3, $4, $5) RETURNING uid", [device_id, sensor_id, key, minValue, maxValue, siunit]);

                return res.status(200).json({ result: "Success" });
            } else {
                return res.status(300).json({ invalidUserId: "UserID not Present...Record Not Inserted" });
            }
        } else {
            return res.status(404).json({ emailExist: "Device Does not exists!!" });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

app.listen("4001", () => {
    console.log("Server running at 4001")
})