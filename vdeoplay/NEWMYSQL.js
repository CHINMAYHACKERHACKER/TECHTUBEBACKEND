const mysql=require("mysql");
const connection=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"pc"
})

connection.connect((ERR)=>{
    if(ERR){
        console.log("ERROR CONNECTING DATABASE");
    }
    else{
        console.log("DATABASE CONNECTED");

    }
})

module.exports=connection;
