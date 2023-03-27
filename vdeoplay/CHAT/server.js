const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const app = express();
const cors = require("cors");
app.use(cors());
const connection = require("../NEWMYSQL.js");


const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

app.use(express.json());

const server = http.createServer(app);
const io = socketio(server);


// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "JustChat Bot";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    connection.query(`INSERT INTO pcuseruser (Username,Room) values ('${user.username}','${user.room}')`, (ERR, DATA, fields) => {
      if (ERR) {
        console.log(ERR);
      }
    })

    socket.join(user.room);

    // Welcome current user
    socket.emit(
      "message",
      formatMessage(botName, `Hi ${user.username}!👋 Welcome to JustChat!`)
    );

    app.get("/USERDATA", (req, res) => {
      connection.query(`SELECT * FROM pcuseruser`, (ERR, DATA) => {
        if (ERR) {
          console.log(ERR);
        }
        else {
          console.log(DATA);
          res.send(DATA);
        }
      })
    });
    
    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
