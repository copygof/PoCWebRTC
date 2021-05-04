const express = require('express');
const app = express();
const http = require('http');
const socketIo = require('socket.io');

const PORT = 8080;
const server = http.createServer(app);
const io = socketIo(server, {path: '/io/webrtc'});

const peers = io.of('/webrtcPeer');

//Keep references of all socket and Room connections
const users = {};

const accountList = [
  {id: '001', name: 'สมศรี บุญมี'},
  {id: '002', name: 'สุขวัน ศรีสุข'},
  {id: '003', name: 'อารีย์ มานา'},
  {id: '004', name: 'วีระ โชคช่วย'},
];

peers.on('connection', socket => {
  console.log(
    '=================== New device connecing ======================',
  );
  console.log('device ', socket.id);
  console.log('=========================================');

  // return all account is never use
  peers
    .to(socket.id)
    .emit('connected', accountList.filter(account => !users[account.id]) || []);

  socket.on('register', data => {
    console.log('=================== register ======================');
    console.log('register ', data);
    users[data.id] = data;
    peers
      .to(data.socketId)
      .emit(
        'register-success',
        accountList.filter(account => users[account.id]) || [],
      );
    console.log('=========================================');
  });

  socket.on('offer', data => {
    console.log('=================== offer ======================');
    console.log('offer ', data);
    const from = users[data.id];
    const to = users[data.to];
    peers.to(to.socketId).emit('offer', {
      sdp: data.sdp,
      from: {
        id: from.id,
        name: from.name,
      },
    });
    console.log('=========================================');
  });

  socket.on('answer', data => {
    console.log('=================== answer ======================');
    console.log('answer ', data);
    const from = users[data.id];
    const to = users[data.to];
    peers.to(to.socketId).emit('answer', {
      sdp: data.sdp,
      from: {
        id: from.id,
        name: from.name,
      },
    });

    console.log('=========================================');
  });

  socket.on('hangup', data => {
    console.log('=================== hangup ======================');
    console.log('hangup ', data);
    const from = users[data.id];
    const to = users[data.to];

    // Delete from-to user
    delete users[data.id];
    delete users[data.to];

    const newAccountList =
      accountList.filter(account => !users[account.id]) || [];
    peers.to(from.socketId).emit('hangup', newAccountList);
    peers.to(to.socketId).emit('hangup', newAccountList);

    console.log('=========================================');
  });

  socket.on('candidate', data => {
    console.log('=================== candidate ======================');
    console.log('candidate ', data);
    const to = users[data.to.id];
    if (to && to.socketId) {
      peers.to(to.socketId).emit('candidate', data.candidate);
    }
    console.log('=========================================');
  });

  socket.on('disconnection', data => {
    console.log('=================== disconnection ======================');
    console.log('disconnection ', data.id);
    delete users[data.id];
    console.log('=========================================');
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} is disconnected`);
    delete users[socket.id];
  });
});

server.listen(PORT, () => console.log('Server is listening to port ' + PORT));
