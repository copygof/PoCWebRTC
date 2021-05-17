const express = require('express');
const app = express();
const http = require('http');
const socketIo = require('socket.io');

const PORT = 8080;
const server = http.createServer(app);
const io = socketIo(server, {path: '/io/webrtc'});

const peers = io.of('/webrtcPeer');

//Keep references of all socket and Room connections
let users = {};
let room = [];
let user_register = [];

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
    .emit('connected', accountList.filter(account => !users[account.id]) || [],room,user_register);

  socket.on('register', data => {
    console.log('=================== register ======================');
    console.log('register ', data);
    users[data.id] = data;
    create_room(data);
    console.log("RoomName:"+data.room);
    peers
      .to(data.socketId)
      .emit(
        'register-success',
        accountList.filter(account => users[account.id]) || [],
      );
    console.log('=========================================');
  });

  socket.on('offer', data => {+
    console.log('=================== offer ======================');
    console.log('offer ', data);
    let connect_id;
      user_register.forEach(function (result){
          if(result.id !== data.id && result.room === data.room ){
            connect_id = result.socketId;
          }
      })
    console.log('=================== Form ======================');
    //console.log(name,id);

    peers.to(connect_id).emit('offer', {
      sdp: data.sdp,
      from: {
        id: data.id,
        name: "Hello",
      },
    });
    console.log('=========================================');
  });

  socket.on('answer', data => {

    console.log('=================== offer ======================');
    console.log('offer ', data);
    let connect_id;

    user_register.forEach(function (result){
      if(result.id !== data.id && result.room === data.room ){
        connect_id = result.socketId;
      }
    })
    console.log('=================== AnSwerForm ======================');
    console.log(connect_id)
    peers.to(connect_id).emit('answer', {
      sdp: data.sdp,
      from: {
        id: data.id,
        name: "Hello To",
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


create_room = (data)=>{
  console.log(
    '=================== CreateRoom ======================',
  );
  console.log(data);
  if(user_register.length === 0){
    user_register.push(data);
  }else{
    user_register.forEach(function (result){
      if(result.id !== data.id){
        user_register.push(data);
      }
    })
  }
  console.log( '=================== UserRegister ======================');
  console.log(user_register)

}

server.listen(PORT, () => console.log('Server is listening to port ' + PORT));
