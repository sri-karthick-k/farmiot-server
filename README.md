# farmiot-server

```npm install```

## install latest version of postgreSQL and configure password and username 

## login to postgres using,
psql -U username 

CREATE A DATABASE USING,

```bash
CREATE DATABASE farmiot;
```

CONNECT TO DATABASE USING,
```bash
\c farmiot
```

Database DDL statements are already defined and stored in `database.sql` file. 
First navigate to the directory where database.sql is present
So, you can inject the statements using,
```bash
psql -U <username> -d farmiot -f database.sql
```

Now, coming back to node.js, after installing necessary packages using ```npm install```,
Install nodemon using,
```bash
sudo npm -g nodemon
```

Then in the directory where index.js file is present run,
```bash
nodemon
```

Open Postman or terminal and test the endpoint by,
Postman send request: ```localhost:3000/test```
or
terminal using curl: ```curl localhost:3000/test```

