
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const moment = require('moment');
const dotenv = require("dotenv");
const { Pool, Client } = require('pg');
const redis = require("redis");

dotenv.config()
//comandos para sincronizar local contra volumen de docker
// rsync -avu --delete --ignore-times "/home/team_venom/ms_main/" "/var/lib/docker/volumes/team_venom_volume-main-source-code/_data"
// rsync -avu --delete --ignore-times "/home/team_venom/ms_main/app_main.js" "/var/lib/docker/volumes/team_venom_volume-main-source-code/_data/app_main.js"


const pool = new Pool({
  user: 'user_test',
  host: ''+process.env.PGHOST,
  database: 'prueba',
  password: ''+process.env.PGPASSWORD ,
  port: 5432,
})

// let _sql = "SELECT * FROM prueba WHERE schemaname != 'pg_catalog' AND  schemaname != 'information_schema';";
_sql = 'SELECT * FROM "pg_stat_user_tables" '
pool.query(_sql, (err, res) => {
  console.log(err, res);
  // res.rows.forEach(_r => {
  //   console.log( _r.relname );
  // });
  pool.end()
})

console.log( process.env. PGPORT);

let users = [];
let conected = false;
let socket ={};

let client_redis = redis.createClient(6379,'cn_ms_redis');

client_redis.on("error", function(error) {
  console.log( "redis no conectado... " );
  console.error(error);
});


app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/getHisto', (req, res) => {
  
  let _lista = moment().format("YYYY-MM-DD")
  let _res = {m:"ok",dt:[]};

  client_redis.lrange(_lista, -9, -1, (err, items) => {
    if (err) {
      console.log( "error al traer de MS redis el historico actual " );
      console.log( err );
      return;
    }

    items.forEach((item, i) => {
      // console.log( item );

      let _splited = item.split("|");
      
      _res.dt.push({now:_splited[1], promedio:_splited[0]});

    });

    res.send(JSON.stringify(_res));
  });

  
});//fin de GET historical

let _contador_envios =0;

function random(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function loop(){
  // console.log( "en loop, users "+users.length+", enviados "+_contador_envios );
  if( users.length < 1 )return;

  let _res = {promedio : 0.0,now:''}

  //meter en redis 
  let _lista = moment().format("YYYY-MM-DD")  
  
  _res.now = moment().format("YYYY-MM-DD HH:mm:ss");
  _res.promedio = random(20,100);//valor que debio traerse de la DB PG
  client_redis.rpush(_lista,_res.promedio+"|"+_res.now);
  
  _contador_envios+=1;

  if( _contador_envios < 6 ){
    // simular error de datos NO disponibles
    users.forEach(_io_user => {      
      io.to(_io_user).emit("sinc",JSON.stringify(_res));      
    });
  }
  
}//fin de loop

io.on('connection', (_socket) => {
  console.log('a user connected');
  socket = _socket;
  conected = true;
  _contador_envios =0;//cada vez q se conecta un usuario, dejamos en ceros para testear alarmas de no disponibilidad de datos
  users.push(socket.id);
  
  socket.on('disconnect', () => {

    console.log('usuario desconectado '+socket.id);
    let _users = [];
    users.forEach(_user => {
      if( _socket.id != _user ){
        _users.push(_user);
      }
    });

    users = _users;
    _users = null;

  });

  socket.on('test-message', (msg) => {
    console.log('message test : ' + msg);
  });

});//fin de conexion establecida



server.listen(80, () => {
  console.log('listening on *:80');
});

setInterval(() => {
  loop();
}, 10000);
