var HueApi = require("node-hue-api").HueApi;
var async = require('async');
var HueBulbDriver = require('./hue_bulb');
var Scientist = require("zetta/scientist");
var lightState = require("node-hue-api").lightState;

var HueHubDriver = module.exports = function(data,_newLightFunc) {
  this.type = 'huehub';
  this.name = 'Hue Hub '+data.id;
  this.data = data;
  this._newLight = _newLightFunc;
  this.lights = [];

  if(!data.registered)
    this.state = 'unregistered';
  else{
    this.state = 'registered';
    this.hue = new HueApi(this.data.ipaddress, this.data.user);
  }
};

HueHubDriver.prototype.init = function(config) {
  config
    .when('unregistered', { allow: ['register'] })
    .when('registered', { allow: ['blink','find-lights','all-on','all-off'] })
    .map('register', this.register)
    .map('blink', this.blink)
    .map('all-on',this.allOn)
    .map('all-off',this.allOff)
    .map('find-lights',this.findLights);
};

HueHubDriver.prototype.register = function(cb) {
  var self = this;
  var hue = new HueApi();
  hue.createUser(this.data.ipaddress, null, null, function(err, user) {
    if (err)
      return cb(err);

    self.data.user = user;
    self.data.registered = true;
    self.state = 'registered';
    self.hue = new HueApi(self.data.ipaddress, self.data.user);
    self.findLights(function(){
      cb(null);
    });
  });
};

HueHubDriver.prototype.blink = function(cb) {
  var prevState = this.state;
  var self = this;
  this.state = "blinking";
  self.hue.setGroupLightState(0, {alert : "select"},function(){
    self.state = prevState;
    cb();
  });
};

HueHubDriver.prototype.allOn = function(cb) {
  this.data.lightval = 'on';
  var state = lightState.create().on();
  this.hue.setGroupLightState(0,state,cb);
};

HueHubDriver.prototype.allOff = function(cb) {
  this.data.lightval = 'off';
  var state = lightState.create().off();
  this.hue.setGroupLightState(0,state,cb);
};

HueHubDriver.prototype._lightExists = function(light) {
  return (this.lights.filter(function(l){
    return (l.id === light.id);
  }).length > 0);
};

HueHubDriver.prototype.findLights = function(cb) {
  var self = this;

  this.hue.lights(function(err, res) {
    if (err)
      return cb(err);

    res.lights.forEach(function(light){
      if(self._lightExists(light))
        return;

      self.lights.push(light);
      self._newLight(light,self.hue);
    });
    
    cb();
  });
};
