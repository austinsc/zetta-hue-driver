var lightState = require("node-hue-api").lightState;

var HueBulbDriver = module.exports = function(data,hue) {
  this.type = 'huebulb';
  this.name = 'Hue Bulb '+data.name;
  data.hue = hue;
  this.data = data;
  this.hue = hue;
  this.state = 'off';
};

HueBulbDriver.prototype.init = function(config) {
  config
    .when('on', { allow: ['turn-off', 'toggle','blink','color'] })
    .when('off', { allow: ['turn-on', 'toggle','blink','color'] })
    .when('blink', { allow: ['turn-on', 'toggle','blink','color'] })
    .map('turn-on', this.turnOn)
    .map('turn-off', this.turnOff)
    .map('toggle', this.toggle)
    .map('blink',this.blink)
    .map('color',this.color,[{type:'color',name : 'color'}]);
};

HueBulbDriver.prototype.blink = function(cb){
  var prevState = this.state;
  var self = this;
  this.state = 'blink';
  this.hue.setLightState(this.data.id,{alert : 'select'},function(err){
    self.state = prevState;
    cb();
  });
};


HueBulbDriver.prototype.color = function(color,cb){
  color = color.match(/[0-9a-f]{1,2}/g).map(function(c){ return parseInt(c,16); });
  var self = this;
  var state = lightState.create().on().rgb(color[0],color[1],color[2]);
  this.hue.setLightState(this.data.id,state,function(err){
    cb();
  });
};

HueBulbDriver.prototype.turnOn = function(cb) {
  var self = this;
  self.state = 'on';
  var state = lightState.create().on();
  this.hue.setLightState(this.data.id,state,function(err){
    if(err)
      return cb(err);
    cb();  
  });
};

HueBulbDriver.prototype.turnOff = function(cb) {
  var self = this;
  self.state = 'off';
  var state = lightState.create().off();
  this.hue.setLightState(this.data.id,state,function(err){
    if(err)
      return cb(err);
    cb();  
  });
};

HueBulbDriver.prototype.toggle = function(cb) {
  if (this.state === 'off') {
    this.call('turn-on');
    cb();
  } else if (this.state === 'on') {
    this.call('turn-off');
    cb();
  } else {
    cb(new Error('Invalid state - Valid states are "on" and "off".'));
  }
};
