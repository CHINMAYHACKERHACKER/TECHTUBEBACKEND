const mysql = require("mysql");
require('dotenv').config()

const con = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE  
})

con.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Database connected successfully");

    // Add your database operations here

    // Release the connection back to the pool
    connection.release();
  }
});

// con.connect((ERR) => {
//     if (ERR) {
//         console.log("ERROR CONNECTING DATABASE");
//     }
//     else {
//         console.log("DATABASE CONNECTED");

//     }
// })

module.exports = con;
