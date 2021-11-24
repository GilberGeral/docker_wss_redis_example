
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const moment = require('moment');  


let users = [];
let conected = false;
let socket ={};

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let _contador_envios =0;


function random(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function loop(){
  // console.log( "en loop, users "+users.length+", enviados "+_contador_envios );
  if( users.length < 1 )return;

  let _res = {promedio : 0.0,now:''}
  _res.now = moment().format("YYYY-MM-DD HH:mm:ss");
  _res.promedio = random(20,100);

  _contador_envios+=1;

  if( _contador_envios < 5 ){
    // console.log( "debio enviar " + _res.now);
    users.forEach(_io_user => {
      
      io.to(_io_user).emit("sinc",JSON.stringify(_res));
      
    });
  }
  
}

io.on('connection', (_socket) => {
  console.log('a user connected');
  socket = _socket;
  conected = true;
  _contador_envios =0;
  users.push(socket.id);
  // console.log( "total users "+users.length );

  socket.on('disconnect', () => {

    console.log('user disconnected '+socket.id);
    let _users = [];
    users.forEach(_user => {
      if( _socket.id != _user ){
        _users.push(_user);
      }
    });

    users = _users;
    _users = null;

  });

  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
  });

});//fin de conexion establecida



server.listen(80, () => {
  console.log('listening on *:80');
});

setInterval(() => {
  loop();
}, 3000);
