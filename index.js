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
        const user = result.rows[0];
        if (user) {
            if (email == "admin@mail.com")
                result.rows[0].type = "admin"
            const token = jwt.sign({ id: user.uid, useremail: email }, secretKey);
            return res.status(200).json({"token" : token, "type": result.rows[0].type, "uid": result.rows[0].uid})
        }
        return res.sendStatus(404);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

app.get('/api/authenticate', authenticateJWT, (req, res) => {
    res.status(200).json({ message: 'Valid User 👍' });
});

app.post("/api/add-tenant-user", async (req, res) => {
    try {
        const { name, email, password, address, company, mobile, adminid, role = "user" } = req.body;
        // Should add company, date_of_register
        const result = await pool.query("SELECT name FROM user_details WHERE email=($1)", [email])
        const userQuery = "select role from user_role_management where uid=($1)"
        const managerQuery = userQuery + " and role ='admin';"
        const value = [adminid]

        const typeChecker = role === "manager" ? await pool.query(managerQuery, value) : await pool.query(userQuery, value)

        if(typeChecker.rowCount <= 0){
            return res.status(300).json({ accessDenied: "Sorry you cannot add this type of user" }); 
        }
        const adderType = typeChecker.rows[0].role
        console.log("Adder Type: ", adderType);

        if (result.rowCount > 0) {
            return res.status(300).json({ emailExist: "Email already exists!!" });
        } else {
            if(adderType === "admin" || (adderType === "manager" && role === "user")){

                //     Insert Statement for adding tenant and user
                const result2 = await pool.query("INSERT INTO user_details(name, email, password, address, mobile) VALUES ($1, $2, $3, $4, $5) RETURNING uid", [name, email, password, address, mobile]);
                
                const result3 = await pool.query("INSERT INTO user_role_management(uid, admin_id, role) VALUES($1, $2, $3)", [result2.rows[0].uid, adminid, role])
                
                return res.status(200).json({ uid: result2.rows[0].uid });  
                
            }
            else{
                console.log("accessDenied: Sorry you cannot add this type of user");
                return res.status(300).json({ accessDenied: "Sorry you cannot add this type of user" });
            }  
        }
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: err.message });
    }
})

app.post("/api/add-device", async(req, res)=>{
    try {
        const { device_id, lat, longi, descr, uid } = req.body;  
        const result = await pool.query("SELECT device_id FROM device WHERE device_id=($1)", [device_id])
        if (result.rowCount == 0) {

            const isValidUserId = await pool.query("SELECT uid FROM user_details WHERE uid=($1)", [uid])

            if (isValidUserId.rowCount > 0) {
                //     Insert Statement Device parameters 
                await pool.query("INSERT INTO device(device_id, LOGITUDE,LATITUDE,DESCRIPTION) VALUES ($1, $2, $3, $4)", [device_id, lat, longi, descr]);
                await pool.query("INSERT INTO device_management(uid, device_id, access) VALUES ($1, $2, $3)", [uid, device_id, 'true'])
                return res.status(200).json({ result: "Success" });
            } else {
                return res.status(300).json({ invalidUserId: "UserID not Present...Record Not Inserted" });
            }
        } else {
            return res.status(300).json({ DeviceExist: "Device already exists!!" });
            
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

app.post("/api/device-management", async(req, res) => {
    try {
        const {uid, device_id, access} = req.body;
        const result = await pool.query("SELECT device_id FROM device WHERE device_id=($1)", [device_id])
        if(result.rowCount >=1 ){
            await pool.query("INSERT INTO device_management(uid, device_id, access) VALUES ($1, $2, $3)", [uid, device_id, access])
            return res.status(200).json({ result: "Success" });
        } else {
            return res.status(300).json({ invalidUserId: "Device not found...Record Not Inserted" });
        }
    } catch (err) {
        return res.status(500).json({error: err.message});
    }
})

app.post("/api/add-sensor-parameter", async(req, res)=>{
    try {
        const { device_id, key, minValue, maxValue, siunit, uid } = req.body;
        // Should add company, date_of_register
        // fetch access along with the device_id and check for true or false value
        const result = await pool.query("SELECT device_id FROM device_management WHERE device_id=($1)", [device_id])
        if (result.rowCount > 0) {
            const isValidUserId = await pool.query("SELECT uid FROM user_details WHERE uid=($1)", [uid])

            if (isValidUserId.rowCount > 0) {
                //     Insert Statement Sensor parameters only if both user and device_id is valid
                await pool.query("INSERT INTO sensor_parameters(device_id, key, minValue, maxValue, siunit) VALUES ($1, $2, $3, $4, $5)", [device_id, key, minValue, maxValue, siunit]);

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

app.post("/api/add-sensor-value", async(req, res)=>{
    try {
        const { sensor_id, value, u_time=null } = req.body;
        // Should add company, date_of_register
        // fetch access along with the device_id and check for true or false value
        const result = await pool.query("SELECT sensor_id FROM sensor_parameters WHERE sensor_id=($1)", [sensor_id])
        if (result.rowCount > 0) {
                //     Insert Statement Sensor parameters only if both user and device_id is valid
                await pool.query("INSERT INTO sensor_value(sensor_id, value, u_time) VALUES ($1, $2, $3)", [ sensor_id, value, u_time ]);

                return res.status(200).json({ result: "Success" });
        } else {
            return res.status(404).json({ emailExist: "Sensor parameter does not exist!!" });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

app.get("/api/get-devices", async(req, res)=>{
    try {
        const uid = req.header("user_id");
        const typeOfuser = await pool.query("SELECT role from user_role_management where uid=($1)", [uid])

        if(typeOfuser.rows[0].role === "admin"){
            
            const devices = await pool.query("SELECT * FROM device;")
            return res.status(200).json(devices.rows)

        } 
        else {

            const result = await pool.query("SELECT device_id from device_management where uid = ($1) and access='true';", [uid]);
            if(result.rowCount === 0) {
                return res.status(401).json({error: "No devices"})
            } else{
                const deviceIds = result.rows.map((row) => row.device_id);
                const devices = await pool.query("SELECT * from device where device_id = any ($1);", [deviceIds]) // modify here
                return res.status(200).json(devices.rows)
            }
        }
    } catch (err) {
        return res.status(500).json({error: err.message});
    }
})

app.get("/api/get-sensor-params", async(req, res) => {
    try {
        // const user_id = req.header("user_id")
        const device_id = req.header("device_id")
        const decodedDeviceId = decodeURIComponent(device_id)
        console.log(decodedDeviceId);
        const sensor_params = await pool.query("SELECT * FROM sensor_parameters where device_id=($1);", [decodedDeviceId])

        
        return res.status(200).json(sensor_params.rows)
    } catch (err) {
        return res.status(500).json({error: err.message})
    }
})

app.get("/api/get-sensor-value", async(req, res) => {
    try {
        const sensor_id = req.header("sensor_id")
        const sensor_value = await pool.query("select * from sensor_value where sensor_id = $1 order by id desc limit 1;", [sensor_id])
        console.log(sensor_value.rows[0].value);
        return res.status(200).json(sensor_value.rows)
    } catch (err) {
        return res.status(500).json({error: err.message})
    }
})

app.get("/api/get-sensor-value1", async(req, res) => {
    try {
        const device_id = decodeURIComponent(req.header("device_id"))
        const sensor_params = await pool.query("SELECT * FROM sensor_parameters where device_id=($1);", [device_id])
        
        for(let i=0; i<sensor_params.rowCount; i++){
            const sensor_value = await pool.query("select * from sensor_value where sensor_id = $1 order by id desc limit 1;", [sensor_params.rows[i].sensor_id])
            sensor_params.rows[i].value = sensor_value.rows[0].value;
            sensor_params.rows[i].u_time = sensor_value.rows[0].u_time;
        }

        console.log(sensor_params.rows[1].sensor_id);

        return res.status(200).json(sensor_params.rows)
    } catch (err) {
        return res.status(500).json({error: err.message})
    }
})

app.get("/api/get-tenant-user", async(req, res) => {
    try {
        const uid = req.header("uid")
        const role = req.header("role")


        const typeOfUser = await pool.query("SELECT role from user_role_management where uid=($1)", [uid])


        if(typeOfUser.rows[0].role === "admin"){
            const user = await pool.query("select * from user_details where uid in (select uid from user_role_management where role=$1);", [role])
            return res.status(200).json(user.rows)
        } else {
            const user = await pool.query("select * from user_details where uid in (select uid from user_role_management where role=($1) and admin_id=($2));", [role, uid])
            return res.status(200).json(user.rows)
        }
        
    } catch (err) {
        return res.status(500).json({error: err.message})
    }
})

app.get("/api/get-user", async(req, res) => {
    try {
        const uid = req.header("uid")
        const user = await pool.query("select * from user_details where uid in (select uid from user_role_management where role='user' and admin_id=$1);", [uid])
        return res.status(200).json(user.rows)
    } catch (err) {
        return res.status(500).json({error: err.message})
    }
})

app.listen("4001", () => {
    console.log("Server running at 4001")
})
