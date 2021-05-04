var express = require('express');
const app = express();
var http = require('http');
var socketIo = require('socket.io');

const PORT = 8080;

// app.use(express.static(__dirname + '/build'));

// //Default Room
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/build/index.html');
// });

// //Provided Room
// app.get('/:room', (req, res) => {
//   res.sendFile(__dirname + '/build/index.html');
// });

const server = http.createServer(app);
const io = socketIo(server, {path: '/io/webrtc'});

const peers = io.of('/webrtcPeer');

//Keep references of all socket and Room connections
const rooms = {};
const messages = {};
const users = {};

peers.on('connection', socket => {
  const room = socket.handshake.query.room;
  console.log('New User Connected with socket id ', socket.id, 'Room : ', room);

  rooms[room] =
    (rooms[room] && rooms[room].set(socket.id, socket)) ||
    new Map().set(socket.id, socket);

  messages[room] = messages[room] || [];

  users[socket.id + ''] = {
    socket,
  };

  // console.log('users => ', users);

  socket.emit('connection-success', {
    success: socket.id,
    peerCount: rooms[room].size,
    messages: messages[room],
    userId: socket.id,
  });

  //   connectedPeers.set(socket.id, socket);
  //   const broadcast = () =>
  //     socket.broadcast.emit("joined-peers", {
  //       peerCount: connectedPeers.size,
  //     });

  const broadcast = () => {
    const connectedPeers = rooms[room];
    for (const [socketId, _socket] of connectedPeers.entries()) {
      if (socketId !== socket.id) {
        _socket.emit('joined-peers', {
          peerCount: connectedPeers.size,
        });
      }
    }
  };

  broadcast();

  const disconnectedPeer = socketId => {
    const connectedPeers = rooms[room];

    console.log(`New peer count ${connectedPeers.size}`);

    for (const [_socketId, _socket] of connectedPeers) {
      _socket.emit('peer-disconnected', {
        peerCount: connectedPeers.size,
        socketId,
      });
    }
  };

  socket.on('register-user', data => {
    console.log('register-users => ', data);
    // console.log('all users => ', users);
    users[data.userId + ''] = {
      ...users[data.userId + ''],
      ...data,
    };
    // users[data.userId].userId = data.userId;
    // users[data.userId].userName = data.userName;

    // console.log(' users[data.userId] all users => ', users);
  });

  socket.on('offer', data => {
    console.log('========= offer ===========');

    console.log(
      'All users => ',
      Object.values(users).map(({socket, ...v}) => ({...v})),
    );
    const friendByName = Object.values(users).find(
      v => v.userName === data.friendName,
    );
    console.log('data => ', data.friendName);
    console.log('data => ', friendByName.userId);
    // console.log('data => ', friendByName);
    // console.log('users => ', users);

    const offerUser = Object.values(users).find(
      v => v.userId === data.socketId,
    );

    friendByName.socket.emit('offer', {
      sdp: data.payload,
      socketId: friendByName.userId,
      offerUser: {userId: offerUser.userId, userName: offerUser.userName},
    });
    // friendByName.socket.emit('offer', data.payload);
  });

  socket.on('candidate', data => {
    console.log('========= candidate ===========');
    const friendByName = Object.values(users).find(
      v => v.userName === data.friendName,
    );
    console.log('data => ', data.friendName);
    // console.log('data => ', friendByName);

    if (friendByName) {
      friendByName.socket.emit('candidate', data.payload);
      // friendByName.socket.emit('candidate', {
      //   candidate: data.payload,
      //   socketId: friendByName.userId,
      // });
    }
  });

  socket.on('answer', data => {
    console.log('========= answer ===========');
    const friendByName = Object.values(users).find(
      v => v.userName === data.friendName,
    );
    console.log('data => ', data.friendName);
    // console.log('data => ', friendByName);

    friendByName.socket.emit('answer', data.payload);
    // friendByName.socket.emit('answer', {
    //   sdp: data.payload,
    //   socketId: data.socketId,
    // });
  });

  // ------------------

  // socket.on('candidate', data => {
  //   const connectedPeers = rooms[room];
  //   for (const [socketId, socket] of connectedPeers.entries()) {
  //     if (socketId === data.socketId.remote) {
  //       socket.emit('candidate', {
  //         candidate: data.payload,
  //         socketId: data.socketId.local,
  //       });
  //     }
  //   }
  // });

  // socket.on('new-message', data => {
  //   console.log('new message ', JSON.parse(data.payload));
  //   messages[room] = [...messages[room], JSON.parse(data.payload)];
  // });

  // socket.on('offerOrAnswer', data => {
  //   const connectedPeers = rooms[room];
  //   for (const [socketId, socket] of connectedPeers.entries()) {
  //     if (socketId !== data.socketId) {
  //       console.log(socketId, data.payload.type);
  //       socket.emit('offerOrAnswer', data.payload);
  //     }
  //   }
  // });

  // socket.on('offer', data => {
  //   const connectedPeers = rooms[room];
  //   for (const [socketId, socket] of connectedPeers.entries()) {
  //     if (socketId === data.socketId.remote) {
  //       socket.emit('offer', {
  //         sdp: data.payload,
  //         socketId: data.socketId.local,
  //       });
  //     }
  //   }
  // });

  // socket.on('answer', data => {
  //   const connectedPeers = rooms[room];
  //   for (const [socketId, socket] of connectedPeers.entries()) {
  //     if (socketId === data.socketId.remote) {
  //       socket.emit('answer', {
  //         sdp: data.payload,
  //         socketId: data.socketId.local,
  //       });
  //     }
  //   }
  // });

  // socket.on('candidate', data => {
  //   const connectedPeers = rooms[room];
  //   for (const [socketId, socket] of connectedPeers.entries()) {
  //     if (socketId === data.socketId.remote) {
  //       socket.emit('candidate', {
  //         candidate: data.payload,
  //         socketId: data.socketId.local,
  //       });
  //     }
  //   }
  // });

  socket.on('disconnect', () => {
    const connectedPeers = rooms[room];
    console.log(`User ${socket.id} is disconnected`);
    connectedPeers.delete(socket.id);
    disconnectedPeer(socket.id);
  });

  socket.on('onlinePeers', data => {
    const connectedPeers = rooms[room];
    for (const [socketId, _socket] of connectedPeers.entries()) {
      if (socketId !== data.socketId.local) {
        console.log('Online Peer', data.socketId, socketId);
        socket.emit('online-peer', socketId);
      }
    }
  });
});

server.listen(PORT, () => console.log('Server is listening to port 8080'));
