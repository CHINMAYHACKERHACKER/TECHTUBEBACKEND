const mysql = require("mysql");

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "HACKER",
    database: "mac"
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
