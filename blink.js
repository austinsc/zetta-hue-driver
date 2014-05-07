var hue = require("node-hue-api"),
    HueApi = hue.HueApi,
    lightState = hue.lightState;


var host = "192.168.1.26",
    username = "34924aa3c87df0f23e6f79b3539ae87",
    api = new HueApi(host, username),
    state;

//var state = lightState.create().alert().transition(0);
//var state = {alert : 'select'};
//api.setGroupLightState(0,state,function(err){});


var onState = {transitiontime: 0, on: true, bri: 100};
var offState = {transitiontime: 0, on: false, bri: 100};


function change(state,cb){
  api.setGroupLightState(0,state,cb);
}

function off(cb){
  change(offState,cb);
}

function on(cb){
  change(onState,cb);
}

on(function(){
  setTimeout(function(){
    off(function(){});
  },200);
});



