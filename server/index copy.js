// const app = require('./app');
// // const socket = require('socket.io');
// const socket = require('./lib/socket');

// const PORT = process.env.PORT || 8080;

// const server = app.listen(PORT, () => {
//   console.log(`App listening on port ${PORT}!`);
// });

// socket(server);

// const express = require("express");
// const app = express();

// const port = 4000;

// const http = require("http");
// const server = http.createServer(app);

// const io = require("socket.io")(server, { origins: "*:*" });
// app.use(express.static(__dirname + "/public"));

// io.sockets.on("error", (e) => console.log(e));
// server.listen(port, () => console.log(`Server is running on port ${port}`));

// let broadcaster;

// io.sockets.on("connection", (socket) => {
//   socket.on("broadcaster", () => {
//     broadcaster = socket.id;
//     socket.broadcast.emit("broadcaster");
//   });
//   socket.on("watcher", () => {
//     socket.to(broadcaster).emit("watcher", socket.id);
//   });
//   socket.on("disconnect", () => {
//     socket.to(broadcaster).emit("disconnectPeer", socket.id);
//   });
//   socket.on("offer", (id, message) => {
//     socket.to(id).emit("offer", socket.id, message);
//   });
//   socket.on("answer", (id, message) => {
//     socket.to(id).emit("answer", socket.id, message);
//   });
//   socket.on("candidate", (id, message) => {
//     socket.to(id).emit("candidate", socket.id, message);
//   });
//   socket.on('comment', (id, message) => {
//     socket.to(id).emit("comment", socket.id, message);
//   });
// });

// ----------------------------

// var app = require('express')();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

// var connections = [];

// function listAllConnections() {
//   console.log('Conenctions', connections[0], connections[1]);
// }

// io.on('connection', function (socket) {
//   console.log('connectioned ...');
//   var role = '';
//   if (Object.entries(connections).length == 0) {
//     connections = connections.filter(c => c.role != 'sender');
//     connections.push({id: socket.id, role: 'sender'});
//     role = 'sender';
//   } else {
//     connections = connections.filter(c => c.role != 'receiver');
//     connections.push({id: socket.id, role: 'receiver'});
//     role = 'receiver';
//   }

//   listAllConnections();

//   socket.on('offer', function (offer) {
//     console.log('offer', offer);
//     var sid = connections.filter(c => c.role == 'receiver');
//     console.log('sid receiver', sid);
//     io.to(sid[0].id).emit('offer', offer);
//     console.log('offeremited');
//   });

//   socket.on('answer', function (answer) {
//     console.log('answer', answer);
//     var sid = connections.filter(c => c.role == 'sender');
//     console.log('sid sender', sid);
//     io.to(sid[0].id).emit('answer', answer);
//     console.log('answeremited');
//   });
// });

// http.listen(3000, function () {
//   console.log('listening on *:3000');
// });

// ----

// var app = require('express')();
// var http = require('https').Server(app);
// var io = require('socket.io')(http);
// const port = process.env.PORT || 3000;

const express = require('express');
const app = express();
let http = require('http').Server(app);

const port = process.env.PORT || 3000;

let io = require('socket.io')(http, {origins: '*:*'});
// io.origins('*:*');

function listAllConnections() {
  console.log('Conenctions');
}

http.listen(port, () => {
  console.log('listening on ', port);
});

const rooms = io.sockets.adapter.rooms || {};

io.on('connection', socket => {
  console.log('a user connected to socket');

  socket.on('joinTheRoom', room => {
    console.log('create or join to room', room);
    const myRoom = rooms[room] || {length: 0};
    const numClients = myRoom.length;
    console.log(room, 'has', numClients, 'clients');

    if (numClients == 0) {
      socket.join(room);
      socket.emit('roomCreated', room);
    } else if (numClients > 0) {
      socket.join(room);
      socket.emit('roomJoined', room);
    } else {
      socket.emit('full', room);
    }
  });

  socket.on('ready', room => {
    console.log('ready');

    socket.broadcast.to(room).emit('ready');
  });

  socket.on('candidate', event => {
    console.log('candidate');
    socket.broadcast.to(event.room).emit('candidate', event);
  });

  socket.on('offer', event => {
    console.log('offer');
    socket.broadcast.to(event.room).emit('offer', event.sdp);
  });

  socket.on('answer', event => {
    console.log('answer');
    socket.broadcast.to(event.room).emit('answer', event.sdp);
  });
});
