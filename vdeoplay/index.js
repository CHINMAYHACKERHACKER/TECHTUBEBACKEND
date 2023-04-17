const express = require("express");
const cors = require("cors");
const axios = require("axios");
const con = require("./MYSQL.js");
const multer = require('multer')
const upload = multer({ dest: 'uploads/' });
const VIDEO = multer({ dest: 'VIDEO/' });
const SONG = multer({ dest: 'SONG/' });
const VIDEONOISEREDUCE = multer({ dest: 'VIDEONOISEREDUCE/' });
const AUDIO = multer({ dest: 'AUDIO/' });
var nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const converter = require('@bishal-9/video-to-mp3-converter');
const fullPath = path.join(__dirname, 'SONG');
const { Leopard } = require("@picovoice/leopard-node");
var zip = require('file-zip');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));
app.use("/uploads", express.static("./uploads"));
app.use("/VIDEO", express.static("./VIDEO"));
app.use("/VIDEONOISEREDUCE", express.static("./VIDEONOISEREDUCE"));
app.use("/AUDIO", express.static("./AUDIO"));
app.use(express.static("./SONG"));
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

app.post("/VIDEO", VIDEO.array('VIDEO'), (req, res, next) => {
  // console.log(req);
  // console.log(req.files[0].filename);
  // console.log(req.files[0].destination);

  const TITLE = req.body.TITLE;
  // // const DESCRIPTION = req.body.DESCRIPTION;
  const USERUNIQUEID = req.body.USERUNIQUEID;
  const VIDEO = req.files[0].filename;
  const DESTINATION = req.files[0].destination;
  // const USERVIDEO = req.files[1].filename;
  // const USERDESTINATION = req.files[1].destination;
  const NOISEREDUCE = req.body.NOISEREDUCE;
  const pathToVideo = DESTINATION + VIDEO;
  const AUDIO = req.body.AUDIO;
  const USERAUDIO = req.body.USERAUDIO;
  const targetFolder = './VIDEONOISEREDUCE';

  // fs.rename(req.files[1].path, `${targetFolder}/${req.files[1].filename}`, function (err) {
  //   if (err) throw err;
  //   console.log('File moved successfully!');
  // });


  if (AUDIO == "yes") {

    fs.rename(req.files[1].path, `${targetFolder}/${req.files[1].filename}`, function (err) {
      if (err) throw err;
      console.log('File moved successfully!');
    });

    const INPUTFILEPATH = DESTINATION + VIDEO;
    const FILEPATH = `VIDEONOISEREDUCE/${req.files[1].filename}`;
    const OUTPUTFILEPATH = `VIDEONOISEREDUCE/${VIDEO}` + ".mp4";
    const temp_OUTPUTFILEPATH = `${OUTPUTFILEPATH}`;

    command = `ffmpeg -i ${INPUTFILEPATH} -af "highpass=f=20,lowpass=f=1,volume=85dB,volume=3.0" -c:a libmp3lame -q:a 2 ${OUTPUTFILEPATH}`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("BACKGROUND NOISE REOMVED");

      COMAND = `ffmpeg -y -i ${OUTPUTFILEPATH} -i ${FILEPATH} -filter_complex "[1:a]volume=0.5[a1];[0:a]equalizer=f=1000:width_type=h:width=100:g=-50,volume=15.0[a];[a][a1]amix=inputs=2" ${OUTPUTFILEPATH + "temp.mp4"} && mv ${OUTPUTFILEPATH + "temp.mp4"} ${OUTPUTFILEPATH}`;
      exec(COMAND, (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("BACKGROUND MUSIC ADDED TO VIDEO");

        const FILEONE = `${OUTPUTFILEPATH}` + "_" + "1080p" + ".mp4";
        const outputFile1080p = FILEONE.replace(/\.mp4_/, '_');

        const FILETWO = `${OUTPUTFILEPATH}` + "_" + "720p" + ".mp4";
        const outputFile720p = FILETWO.replace(/\.mp4_/, '_');

        const FILETHREE = `${OUTPUTFILEPATH}` + "_" + "540p" + ".mp4";
        const outputFile540p = FILETHREE.replace(/\.mp4_/, '_');

        const FILEFIVE = `${OUTPUTFILEPATH}` + "_" + "360p" + ".mp4";
        const outputFile360p = FILEFIVE.replace(/\.mp4_/, '_');

        // Create a new command using fluent-ffmpeg
        const command = ffmpeg();

        // Set input stream
        command.input(`${OUTPUTFILEPATH}`);

        // Set video codec to libx264 to maintain quality
        command.videoCodec('libx264');

        // Set a lower bitrate to reduce file size
        command.videoBitrate('800k');

        // Set audio codec to aac
        command.audioCodec('aac');

        // Set a lower audio bitrate to reduce file size
        command.audioBitrate('128k');

        // Set output file paths for each resolution
        command.output(outputFile1080p)
          .videoFilters('scale=w=1920:h=1080')
          .outputOptions('-c:a copy');
        command.output(outputFile720p)
          .videoFilters('scale=w=1280:h=720')
          .outputOptions('-c:a copy');
        command.output(outputFile540p)
          .videoFilters('scale=w=960:h=540')
          .outputOptions('-c:a copy');
        command.output(outputFile360p)
          .videoFilters('scale=w=640:h=360')
          .outputOptions('-c:a copy');

        // Run the command and log the output
        command.on('error', (err) => {
          console.error('An error occurred:', err.message);
        }).on('end', () => {
          console.log('Compression complete!');
          const INSERT_QUERY = `INSERT INTO USERVIDEOLIST (TITLE, USERID, VIDEOONE, VIDEOTWO, VIDEOTHREE, VIDEOFIVE, VIDEONOISEREDUCE, VIDEOMUSIC) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
          const values = [TITLE, USERUNIQUEID, outputFile1080p, outputFile720p, outputFile540p, outputFile360p, NOISEREDUCE, AUDIO];
          con.query(INSERT_QUERY, values, (err, result) => {
            if (err) throw err;
            console.log("Video inserted into database");
            res.send("Video uploaded and compressed successfully");
          });
        }).run();
      });
    });
  }
  else if (NOISEREDUCE == "yes") {
    const INPUTFILEPATH = DESTINATION + VIDEO;
    const OUTPUTFILEPATH = `VIDEONOISEREDUCE/${VIDEO}` + ".mp4";
    const temp_OUTPUTFILEPATH = `${OUTPUTFILEPATH}`;

    command = `ffmpeg -i ${INPUTFILEPATH} -af "highpass=f=20,lowpass=f=1,volume=85dB,volume=3.0" -c:a libmp3lame -q:a 2 ${OUTPUTFILEPATH}`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("BACKGROUND NOISE REOMVED");

      const FILEONE = `${OUTPUTFILEPATH}` + "_" + "1080p" + ".mp4";
      const outputFile1080p = FILEONE.replace(/\.mp4_/, '_');

      const FILETWO = `${OUTPUTFILEPATH}` + "_" + "720p" + ".mp4";
      const outputFile720p = FILETWO.replace(/\.mp4_/, '_');

      const FILETHREE = `${OUTPUTFILEPATH}` + "_" + "540p" + ".mp4";
      const outputFile540p = FILETHREE.replace(/\.mp4_/, '_');

      const FILEFIVE = `${OUTPUTFILEPATH}` + "_" + "360p" + ".mp4";
      const outputFile360p = FILEFIVE.replace(/\.mp4_/, '_');

      // Create a new command using fluent-ffmpeg
      const command = ffmpeg();

      // Set input stream
      command.input(`${OUTPUTFILEPATH}`);

      // Set video codec to libx264 to maintain quality
      command.videoCodec('libx264');

      // Set a lower bitrate to reduce file size
      command.videoBitrate('800k');

      // Set audio codec to aac
      command.audioCodec('aac');

      // Set a lower audio bitrate to reduce file size
      command.audioBitrate('128k');

      // Set output file paths for each resolution
      command.output(outputFile1080p)
        .videoFilters('scale=w=1920:h=1080')
        .outputOptions('-c:a copy');
      command.output(outputFile720p)
        .videoFilters('scale=w=1280:h=720')
        .outputOptions('-c:a copy');
      command.output(outputFile540p)
        .videoFilters('scale=w=960:h=540')
        .outputOptions('-c:a copy');
      command.output(outputFile360p)
        .videoFilters('scale=w=640:h=360')
        .outputOptions('-c:a copy');

      // Run the command and log the output
      command.on('error', (err) => {
        console.error('An error occurred:', err.message);
      }).on('end', () => {
        console.log('Compression complete!');
        const INSERT_QUERY = `INSERT INTO USERVIDEOLIST (TITLE, USERID, VIDEOONE, VIDEOTWO, VIDEOTHREE, VIDEOFIVE, VIDEONOISEREDUCE) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [TITLE, USERUNIQUEID, outputFile1080p, outputFile720p, outputFile540p, outputFile360p, NOISEREDUCE];
        con.query(INSERT_QUERY, values, (err, result) => {
          if (err) throw err;
          console.log("Video inserted into database");
          res.send("Video uploaded and compressed successfully");
        });
      }).run();

    });
  }
  else if (USERAUDIO == "yes") {

    const targetFolder = './VIDEONOISEREDUCE';

    fs.rename(req.files[0].path, `${targetFolder}/${req.files[0].filename}`, function (err) {
      if (err) throw err;
      console.log('File moved successfully!');
    });
    fs.rename(req.files[1].path, `${targetFolder}/${req.files[1].filename}`, function (err) {
      if (err) throw err;
      console.log('File moved successfully!');
    });

    const INPUTFILEPATH = DESTINATION + VIDEO;
    const FILEPATH = `VIDEONOISEREDUCE/${req.files[1].filename}`;
    const OUTPUTFILEPATH = `VIDEONOISEREDUCE/${VIDEO}`;

    COMAND = `ffmpeg -y -i ${OUTPUTFILEPATH} -i ${FILEPATH} -filter_complex "[1:a]volume=0.5[a1];[0:a]equalizer=f=1000:width_type=h:width=100:g=-50,volume=15.0[a];[a][a1]amix=inputs=2" ${OUTPUTFILEPATH + "temp.mp4"} && mv ${OUTPUTFILEPATH + "temp.mp4"} ${OUTPUTFILEPATH}`;
    exec(COMAND, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("BACKGROUND MUSIC ADDED TO VIDEO");

      const FILEONE = `${OUTPUTFILEPATH}` + "_" + "1080p" + ".mp4";
      const outputFile1080p = FILEONE.replace(/\.mp4_/, '_');

      const FILETWO = `${OUTPUTFILEPATH}` + "_" + "720p" + ".mp4";
      const outputFile720p = FILETWO.replace(/\.mp4_/, '_');

      const FILETHREE = `${OUTPUTFILEPATH}` + "_" + "540p" + ".mp4";
      const outputFile540p = FILETHREE.replace(/\.mp4_/, '_');

      const FILEFIVE = `${OUTPUTFILEPATH}` + "_" + "360p" + ".mp4";
      const outputFile360p = FILEFIVE.replace(/\.mp4_/, '_');

      // Create a new command using fluent-ffmpeg
      const command = ffmpeg();

      // Set input stream
      command.input(`${OUTPUTFILEPATH}`);

      // Set video codec to libx264 to maintain quality
      command.videoCodec('libx264');

      // Set a lower bitrate to reduce file size
      command.videoBitrate('800k');

      // Set audio codec to aac
      command.audioCodec('aac');

      // Set a lower audio bitrate to reduce file size
      command.audioBitrate('128k');

      // Set output file paths for each resolution
      command.output(outputFile1080p)
        .videoFilters('scale=w=1920:h=1080')
        .outputOptions('-c:a copy');
      command.output(outputFile720p)
        .videoFilters('scale=w=1280:h=720')
        .outputOptions('-c:a copy');
      command.output(outputFile540p)
        .videoFilters('scale=w=960:h=540')
        .outputOptions('-c:a copy');
      command.output(outputFile360p)
        .videoFilters('scale=w=640:h=360')
        .outputOptions('-c:a copy');

      // Run the command and log the output
      command.on('error', (err) => {
        console.error('An error occurred:', err.message);
      }).on('end', () => {
        console.log('Compression complete!');
        const INSERT_QUERY = `INSERT INTO USERVIDEOLIST (TITLE, USERID, VIDEOONE, VIDEOTWO, VIDEOTHREE, VIDEOFIVE, VIDEONOISEREDUCE, VIDEOMUSIC, USERAUDIO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [TITLE, USERUNIQUEID, outputFile1080p, outputFile720p, outputFile540p, outputFile360p, NOISEREDUCE, AUDIO, USERAUDIO];
        con.query(INSERT_QUERY, values, (err, result) => {
          if (err) throw err;
          console.log("Video inserted into database");
          res.send("Video uploaded and compressed successfully");
        });
      }).run();
    });
  }
  else {

    // Define output file paths for each resolution
    const outputFile1080p = `${DESTINATION}${VIDEO}` + "_" + "1080p" + ".mp4";
    const outputFile720p = `${DESTINATION}${VIDEO}` + "_" + "720p" + ".mp4";
    const outputFile540p = `${DESTINATION}${VIDEO}` + "_" + "540p" + ".mp4";
    const outputFile360p = `${DESTINATION}${VIDEO}` + "_" + "360p" + ".mp4";


    // Create a new command using fluent-ffmpeg
    const command = ffmpeg();

    // Set input stream
    command.input(`${DESTINATION + VIDEO}`);

    // Set video codec to libx264 to maintain quality
    command.videoCodec('libx264');

    // Set a lower bitrate to reduce file size
    command.videoBitrate('800k');

    // Set audio codec to aac
    command.audioCodec('aac');

    // Set a lower audio bitrate to reduce file size
    command.audioBitrate('128k');

    // Set output file paths for each resolution
    command.output(outputFile1080p)
      .videoFilters('scale=w=1920:h=1080')
      .outputOptions('-c:a copy');
    command.output(outputFile720p)
      .videoFilters('scale=w=1280:h=720')
      .outputOptions('-c:a copy');
    command.output(outputFile540p)
      .videoFilters('scale=w=960:h=540')
      .outputOptions('-c:a copy');
    command.output(outputFile360p)
      .videoFilters('scale=w=640:h=360')
      .outputOptions('-c:a copy');

    // Run the command and log the output
    command.on('error', (err) => {
      console.error('An error occurred:', err.message);
    }).on('end', () => {
      console.log('Compression complete!');
      const INSERT_QUERY = `INSERT INTO USERVIDEOLIST (TITLE, USERID, VIDEOONE, VIDEOTWO, VIDEOTHREE, VIDEOFIVE) VALUES (?, ?, ?, ?, ?, ?)`;
      const values = [TITLE, USERUNIQUEID, outputFile1080p, outputFile720p, outputFile540p, outputFile360p];
      con.query(INSERT_QUERY, values, (err, result) => {
        if (err) throw err;
        console.log("Video inserted into database");
        res.send("Video uploaded and compressed successfully");
      });
    }).run();
  }

  const songName = `${TITLE.replace(/ +/g, "")}`;
  converter(pathToVideo, `./SONG/${songName}`);

  setTimeout(() => {
    METHOD(VIDEO, songName)
  }, 60000)

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
})



app.post("/USERCOMMENT", (req, res) => {
  console.log(req);
  const ID = req.body.ID;
  // // const DESCRIPTION = req.body.DESCRIPTION;
  const USERCOMMENT = req.body.USERCOMMENT;
  const USERGENERATED = req.body.USERID;
  var VIDEOFIVE = req.body.VIDEOFIVE;
  var PARAMID = req.body.PARAMID;
  con.query(`INSERT INTO COMMENT (USERVIDEOID,USERCOMMENT,USERGENERATEDID,USERCOMMENTVIDEO,USERPARAMID) values ('${ID}','${USERCOMMENT}','${USERGENERATED}','${VIDEOFIVE}','${PARAMID}')`, (ERR, DATA, fields) => {
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

app.post("/USERSIGNUP", upload.single('IMAGE'), (req, res) => {
  console.log(req);
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

app.get("/USERLOGIN", (req, res) => {
  con.query("SELECT * FROM USERHOMEPAGELOGIN", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/USERIMAGEDATA", (req, res) => {
  con.query("SELECT * FROM USERHOMEPAGELOGIN", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.post("/STATUS", (req, res) => {
  console.log(req.body);
  var ID = req.body.id;
  var USERNAME = req.body.USERNAME;
  var STATUS = req.body.STATUS;
  var USERGENERATE = req.body.USERGENERATEDID;
  var VIDEOFIVE = req.body.VIDEOFIVE;
  if (STATUS == "Like") {
    STATUS = "Liked";
  }
  console.log(STATUS);

  con.query(`INSERT INTO USERSTATUS (USERID,STATUS,USERNAME,USERGENERATEID,USERVIDEO) values ('${ID}','${STATUS}','${USERNAME}','${USERGENERATE}','${VIDEOFIVE}')`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
})


app.get("/STATUS", (req, res) => {
  con.query("SELECT USERID,STATUS, MAX(ID) AS LatestID FROM USERSTATUS GROUP BY USERID", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/USERCOUNTSTATUS", (req, res) => {
  con.query("SELECT USERID, count(*) AS USERCOUNT FROM USERSTATUS GROUP BY USERID", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/USERSONG", (req, res) => {

  con.query('SELECT SUBSTRING_INDEX(SONG, "/", -1) AS USERSONG, USERVIDEO, MAX(ID) AS ID FROM USERSONG GROUP BY SONG, USERVIDEO', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.send(data);
    }
  });
  con.query('DELETE FROM USERSONG WHERE SONG IS NULL OR USERVIDEO IS NULL', (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result.affectedRows + ' rows deleted');
    }
  });
});

const METHOD = (VIDEO, SONGNAME) => {
  console.log("VIDEO", VIDEO);
  console.log("SONGNAME", SONGNAME);
  con.query(`IF  EXISTS(SELECT * FROM USERSONG WHERE SONG ='${"SONG/" + SONGNAME + ".mp3"}') 
  THEN 
     INSERT INTO USERSONG (SONG,USERVIDEO) VALUES ('${"SONG/" + SONGNAME + ".mp3"}','${VIDEO}');
  END IF`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
  })
}

app.get("/USERCOMMENTBELLSTATUS", (req, res) => {
  con.query("SELECT USERGENERATEDID ,USERCOMMENTVIDEO,count(*) AS USERCOUNT FROM COMMENT GROUP BY USERVIDEOID", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/TOTALUSERCOMMENTBELLSTATUS", (req, res) => {
  con.query("SELECT USERGENERATEDID,USERPARAMID,count(*) AS USERCOUNT FROM COMMENT GROUP BY USERGENERATEDID", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/USERFOLLOWSTATUS", (req, res) => {
  con.query("SELECT USERID,USERNAME,USERGENERATEID,USERVIDEO, count(*) AS USERCOUNT FROM USERSTATUS GROUP BY USERID", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});


app.post("/FOLLOWSTATUS", (req, res) => {
  var ID = req.body.id;
  var USERNAME = req.body.USERNAME;
  var STATUSFOLLOW = req.body.STATUSFOLLOW;
  var USERGENERATEDID = req.body.USERGENERATEDID;
  var USERID = req.body.USERID;
  if (STATUSFOLLOW == "Follow") {
    STATUSFOLLOW = "Following";
  }
  console.log(STATUSFOLLOW);

  con.query(`INSERT INTO USERSTATUSFOLLOW (USERID,USERFOLLOWSTATUS,USERNAME,USERGENERATEDID,USERUSERID) values ('${ID}','${STATUSFOLLOW}','${USERNAME}','${USERGENERATEDID}','${USERID}')`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
})

app.get("/FOLLOWSTATUS", (req, res) => {
  con.query("SELECT USERID,USERFOLLOWSTATUS  , count(*) AS USERCOUNT FROM USERSTATUSFOLLOW  GROUP BY USERID", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/USERDATAFOLLOWSTATUS", (req, res) => {
  con.query("SELECT USERID,USERNAME,USERFOLLOWSTATUS,USERGENERATEDID,USERUSERID,count(*) AS USERCOUNT FROM USERSTATUSFOLLOW  GROUP BY USERID", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.get("/USERFOLLOWUSERDATA", (req, res) => {
  con.query("SELECT DISTINCT USERID ,USERFOLLOWSTATUS ,USERNAME ,USERGENERATEDID  FROM USERSTATUSFOLLOW", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});


app.delete("/USERVIDEODELETE/:id", (req, res) => {
  console.log(req.params.id);
  con.query(`DELETE FROM USERVIDEOLIST WHERE id=${req.params.id}`, (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});


app.post("/REPLY", (req, res) => {

  var INPUTVALUE = req.body.INPUTVALUE;
  var USERGENERATEDID = req.body.USERGENERATEDID;
  var USERUNIQUEID = req.body.USERUNIQUEID;
  var ID = req.body.ID;

  con.query(`INSERT INTO USERCOMMENTREPLY (USERID,REPLY,USERREPLYEDID,USERVIDEOID) values ('${USERGENERATEDID}','${INPUTVALUE}','${USERUNIQUEID}','${ID}')`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
})

app.get("/REPLY", (req, res) => {
  con.query("SELECT * FROM USERCOMMENTREPLY", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
});

app.post("/USERVIEWDATA", (req, res) => {
  console.log(req);
  var ID = req.body.ID;
  var USERID = req.body.USERID;
  var VIDEOFIVE = req.body.VIDEOFIVE;
  var USERUNIQUEID = req.body.USERUNIQUEID;

  con.query(`INSERT INTO USERVIEWDATA (USERUNIQUEID,USERVIDEO,VIDEOUPLOADEDUSERID,VIDEOID) values ('${USERUNIQUEID}','${VIDEOFIVE}','${USERID}','${ID}')`, (ERR, DATA, fields) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
      res.send(DATA);
    }
  })
})


app.get("/USERVIEWDATA", (req, res) => {
  con.query("SELECT USERUNIQUEID, USERVIDEO, VIDEOUPLOADEDUSERID, VIDEOID, COUNT(DISTINCT USERUNIQUEID) AS USERCOUNT FROM USERVIEWDATA GROUP BY  VIDEOID", (ERR, DATA) => {
    if (ERR) {
      console.log(ERR);
    }
    else {
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