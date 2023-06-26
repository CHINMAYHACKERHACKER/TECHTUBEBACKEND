const mysql = require("mysql");
require('dotenv').config()

const con = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE  
})

con.connect((ERR) => {
    if (ERR) {
        console.log("ERROR CONNECTING DATABASE");
    }
    else {
        console.log("DATABASE CONNECTED");

    }
})

module.exports = con;
