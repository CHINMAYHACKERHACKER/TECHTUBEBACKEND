const express = require("express");
const cors = require("cors");
const axios = require("axios");
const con = require("./MYSQL.js");
const multer = require('multer')
const upload = multer({ dest: 'uploads/' });
const VIDEO = multer({ dest: 'VIDEO/' });
const SONG = multer({ dest: 'SONG/' });
var nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const converter = require('@bishal-9/video-to-mp3-converter');
const fullPath = path.join(__dirname, 'SONG');



const app = express();
app.use(express.json());
app.use(cors({ origin: true }));
app.use("/uploads", express.static("./uploads"));
app.use("/VIDEO", express.static("./VIDEO"));
app.use("/AD", express.static("./AD"));

const CHAT_ENGINE_PROJECT_ID = "eed0fe8c-e598-4f52-a41c-e11bab68561d";
const CHAT_ENGINE_PRIVATE_KEY = "a6e8c42a-4cd3-4776-a919-d450ee6be3e3";

app.post("/signup", async (req, res) => {
  const { username, secret, email, first_name, last_name } = req.body;

  // Store a user-copy on Chat Engine!
  // Docs at rest.chatengine.io
  try {
    const r = await axios.post(
      "https://api.chatengine.io/users/",
      { username, secret, email, first_name, last_name },
      { headers: { "Private-Key": CHAT_ENGINE_PRIVATE_KEY } }
    );

    return res.status(r.status).json(r.data);
  } catch (e) {
    return res.status(e.response.status).json(e.response.data);
  }
});

app.post("/login", async (req, res) => {
  const { username, secret } = req.body;

  // Fetch this user from Chat Engine in this project!
  // Docs at rest.chatengine.io
  try {
    const r = await axios.get("https://api.chatengine.io/users/me/", {
      headers: {
        "Project-ID": CHAT_ENGINE_PROJECT_ID,
        "User-Name": username,
        "User-Secret": secret,
      },
    });
    return res.status(r.status).json(r.data);
  } catch (e) {
    return res.status(e.response.status).json(e.response.data);
  }
});

app.post("/USERDATA", upload.single('IMAGE'), (req, res, next) => {
  console.log(req.body);
  const FIRSTNAME = req.body.FIRSTNAME;
  const LASTNAME = req.body.LASTNAME;
  con.query(`INSERT INTO macuser (FIRSTNAME,LASTNAME) values ('${FIRSTNAME}','${LASTNAME}')`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/USERDATA", (req, res, next) => {
  con.query(`SELECT * FROM macuser`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.post("/USERRESOURCE", (req, res, next) => {
  const RESOURCE = req.body.RESOURCE;
  const RESOURCELINK = req.body.RESOURCELINK;
  con.query(`INSERT INTO userlink (RESOURCE,LINK) values ('${RESOURCE}','${RESOURCELINK}')`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});


app.get("/USERRESOURCE", (req, res, next) => {
  con.query(`SELECT * FROM userlink`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.post("/VIDEO", VIDEO.single('VIDEO'), (req, res, next) => {
  const TITLE = req.body.TITLE;
  // // const DESCRIPTION = req.body.DESCRIPTION;
  const USERUNIQUEID = req.body.USERUNIQUEID;
  const VIDEO = req.file.filename;
  const DESTINATION = req.file.destination;

  // const pathToVideo = DESTINATION + VIDEO;
  // const songName = "SMAPLE";

  // converter(pathToVideo, songName);

  // const directoryPath = path.join(__dirname, "SONG");
  // console.log(directoryPath);

  // fs.readdir(directoryPath, (err, files) => {
  //   if (err) {
  //     console.error(err);
  //     return res.status(500).send(err);
  //   }

  //   const fileList = files.map((file) => file);
  //   con.query(`INSERT INTO USERSONG (SONG) values ('${directoryPath+"/"+fileList}')`, (ERR, DATA, fields) => {
  //     if (ERR) {
  //       console.log(ERR);
  //     }
  //     else {
  //       res.send(DATA);
  //     }
  //   })
  // });

  con.query(`INSERT INTO USERVIDEOLIST (TITLE,VIDEO,USERID) values ('${TITLE}','${DESTINATION + VIDEO}','${USERUNIQUEID}')`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});



app.get("/USERVIDEOVIDEO", VIDEO.single('VIDEO'), (req, res, next) => {
  con.query(`SELECT * FROM USERVIDEOLIST`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});



app.post("/USERCOMMENT", (req, res) => {
  console.log(req);
  const ID = req.body.ID;
  // // const DESCRIPTION = req.body.DESCRIPTION;
  const USERCOMMENT = req.body.USERCOMMENT;
  con.query(`INSERT INTO COMMENT (USERVIDEOID,USERCOMMENT) values ('${ID}','${USERCOMMENT}')`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/USERCOMMENT", (req, res, next) => {
  con.query(`SELECT * FROM COMMENT`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/VIDEOINFORMATION", (req, res) => {

  con.query("SELECT * FROM macuser", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
})

app.get("/USERVIDEOLISTINFORMATION", VIDEO.single('VIDEO'), (req, res) => {
  con.query("SELECT * FROM USERVIDEOLIST", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
})

app.post("/USERSIGNUP", upload.single('IMAGE'),(req,res)=>{
  const USERNAME = req.body.USERNAME;
  const PASSWORD = req.body.PASSWORD;
  const EMAIL = req.body.EMAIL;
  const USERGENERATEDID = req.body.USERGENERATEDID;
  const IMAGE = req.file.filename;
  const DESTINATION = req.file.destination;
  con.query(`INSERT INTO USERHOMEPAGELOGIN (USERNAME,PASSWORD,EMAIL,USERGENERATEDID,IMAGE) values ('${USERNAME}','${PASSWORD}','${EMAIL}','${USERGENERATEDID}','${DESTINATION + IMAGE}')`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
})

  app.get("/USERLOGIN",(req,res)=>{
    con.query("SELECT * FROM USERHOMEPAGELOGIN",(ERR,DATA)=>{
      if(ERR){
        console.log(ERR);
      }
      else{
        res.send(DATA);
      }
    })
  });

  app.get("/USERIMAGEDATA",(req,res)=>{
    con.query("SELECT * FROM USERHOMEPAGELOGIN",(ERR,DATA)=>{
      if(ERR){
        console.log(ERR);
      }
      else{
        res.send(DATA);
      }
    })
  });

  app.post("/STATUS",(req,res)=>{
    console.log( req.body);
    var ID = req.body.id;
    var USERNAME = req.body.USERNAME;
    var STATUS = req.body.STATUS;
    var USERGENERATE = req.body.USERGENERATEDID;
    if(STATUS=="Follow"){
      STATUS="Following";
    }
    console.log(STATUS);

    con.query(`INSERT INTO USERSTATUS (USERID,STATUS,USERNAME,USERGENERATEID) values ('${ID}','${STATUS}','${USERNAME}','${USERGENERATE}')`, (ERR, DATA, fields) => {
      if (ERR) {
        console.log(ERR);
      }
      else {
        res.send(DATA);
      }
    })
  })


  app.get("/STATUS",(req,res)=>{
    con.query("SELECT USERID,STATUS, MAX(ID) AS LatestID FROM USERSTATUS GROUP BY USERID",(ERR,DATA)=>{
      if(ERR){
        console.log(ERR);
      }
      else{
        res.send(DATA);
      }
    })
  });

  app.get("/USERCOUNTSTATUS",(req,res)=>{
    con.query("SELECT USERID, count(*) AS USERCOUNT FROM USERSTATUS GROUP BY USERID",(ERR,DATA)=>{
      if(ERR){
        console.log(ERR);
      }
      else{
        res.send(DATA);
      }
    })
  });

   

app.post("/contact", (req, res) => {
  const MESSAGE = req.body.MESSAGE;

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'chinmaysoftwaredev@gmail.com',
      pass: 'mptaiiuslmuqgjcr'
    }
  });

  var mailOptions = {
    to: 'chinmaysoftwaredev@gmail.com',
    text: MESSAGE
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
})

// vvv On port 3001!
app.listen(3001, () => {
  console.log("LISTENING TO PORT 3001");
});