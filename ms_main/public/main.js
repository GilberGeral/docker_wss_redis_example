window.addEventListener("load",init);

let socket = {};
let last_register_server = {};
let intentos_alarm = 2;
let hasSound = 0;
let intentos_fail =0;
let historic = [];
let alarm_sound = {};

const CLASS_LOADING = 'card_signal_loading';
const FORMAT_DATETIME = "YYYY-MM-DD HH:mm:ss";
const LOOP_MONITOR = 3000;
const LARGO_HISTORICO = 10;

function send_string( _string, _key){
  socket.emit(_key, _string);
  
}

function setAlarmSound(){
  
  intentos_alarm = $("#set_alarm").prop("checked");
  if( intentos_alarm == false){
    localStorage.setItem("alarm_sound",0);
    hasSound = 0;
  }else{
    localStorage.setItem("alarm_sound",1);
    hasSound = 1;
  }
  

}

function loop(){
  let _now = moment();


  let duration = moment.duration(_now.diff(last_register_server));
  let _segs = parseInt(duration.asSeconds());
  console.log( "ultima transmision de server a las "+last_register_server.format(FORMAT_DATETIME) );
  console.log( "segundos desde la ultima transmision "+_segs+", intentos fail "+intentos_fail+", intentos alarm  "+intentos_alarm );

  if( _segs < ~~(LOOP_MONITOR/1000) ){
    intentos_fail = 0;
    last_register_server = moment();
  }else{
    intentos_fail += 1;
  }

  if( intentos_fail > intentos_alarm ){
    $("#card_signal").removeClass("bg-success");
    $("#card_signal").addClass("bg-danger");

    if( hasSound == 1 ){
      alarm_sound.play();
    }
    

  }else{
    
    $("#card_signal").removeClass("bg-danger");
    $("#card_signal").addClass("bg-success");
  }
}

function updateHistorical(_data){
  historic.push(_data);

  // let _s = [];
  if( historic.length > LARGO_HISTORICO ){     
    historic.shift();
  }

  

  $("#lHistorico").empty();
  // let _histo_reversed = historic;
  // _histo_reversed.reverse();
  for(let _g = 0; _g < LARGO_HISTORICO; _g+=1){
    
    if( ((historic.length-1) -_g) > -1 ){
      let _reg = historic[(historic.length-1) - _g];
      let _str = `<li class="list-group-item">${_reg.promedio} (<i>${_reg.now}</i>)</li>`;
      $("#lHistorico").append(_str);
    }
    
  }
  
}

function setIntentos(){
  intentos_alarm = $("#intentos_alarm").val();
  localStorage.setItem("intentos",intentos_alarm);
}

function init(){
  console.log( "en init " );
  if( localStorage.getItem("intentos") == undefined | localStorage.getItem("intentos") == null ){
    localStorage.setItem("intentos","1");
    $("#intentos_alarm").val("1");
  }else{
    intentos_alarm = localStorage.getItem("intentos");
    $("#intentos_alarm").val(intentos_alarm);
  }
  
  if( localStorage.getItem("alarm_sound") == undefined | localStorage.getItem("alarm_sound") == null ){
    hasSound=0;
    localStorage.setItem("alarm_sound",hasSound);
    $("#set_alarm").prop("checked",false);
  }else{
    hasSound = parseInt(localStorage.getItem("alarm_sound") );
    console.log( "sound de local "+hasSound );
    if( hasSound == 1 ){
      $("#set_alarm").prop("checked",true);
    }else{
      $("#set_alarm").prop("checked",false);
    }
    
  }

  $("#intentos_alarm").on("change",()=>{
    setIntentos();
  });

  $("#set_alarm").on("click",()=>{
    setAlarmSound();
  });

  //set socket
  socket = io();

  socket.on("connect", () => {
    $("#mOnline").html("Cada 10 segundos");
    $("#mOnline").removeClass("text-danger");
  });

  socket.io.on("reconnect", (attempt) => {
    $("#mOnline").html("Cada 10 segundos");
    $("#mOnline").removeClass("text-danger");
    console.log( "reconectado " );
  });

  socket.on("disconnect", () => {
    $("#mOnline").html("No conectado");
    $("#mOnline").addClass("text-danger");
  });


  socket.on('sinc', function(msg) {
    // console.log( "llego " );
    // console.log( msg );
    let _dt = JSON.parse(msg);
    // console.log( _dt );
    $("#card_signal").addClass(CLASS_LOADING);

    $("#dTitulo").html(_dt.promedio);
    $("#dTime").html(_dt.now);

    last_register_server = moment(_dt.now,FORMAT_DATETIME);
    updateHistorical(_dt);

    setTimeout(() => {
      $("#card_signal").removeClass(CLASS_LOADING);
    }, 1000);

  });//fin de sinc de socket


  alarm_sound = new Howl({
    src: ['/public/alarm.mp3', '/public/alarm.ogg']
  });

  

  setInterval(() => {
    loop();
  }, LOOP_MONITOR);



}//fin de init