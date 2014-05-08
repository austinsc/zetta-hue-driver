var HueApi = require("node-hue-api").HueApi;
var async = require('async');
var HueBulbDriver = require('./hue_bulb');
var Scientist = require("zetta-runtime").scientist;
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
    .when('registered', { allow: ['blink','find-lights','all-on','all-off','brightness', 'color','color-loop'] })
    .when('colorloop', { allow: ['blink','find-lights','all-on','all-off','brightness', 'color'] })
    .map('register', this.register)
    .map('blink', this.blink)
    .map('all-on',this.allOn)
    .map('all-off',this.allOff)
    .map('find-lights',this.findLights)
    .map('color-loop',this.colorLoop)
    .map('color',this.color,[{type:'color',name : 'color'}])
    .map('brightness',this.brightness,[{type: 'number', name: 'brightness'}]);
};

HueHubDriver.prototype.register = function(cb) {
  var self = this;
  var hue = new HueApi();
  hue.createUser(this.data.ipaddress, null, null, function(err, user) {
    if (err)
      return cb(null);

    self.data.user = user;
    self.data.registered = true;
    self.state = 'registered';
    self.hue = new HueApi(self.data.ipaddress, self.data.user);
    self.findLights(function(){
      cb(null);
    });
  });
};

HueHubDriver.prototype.color = function(color,cb){
  if(!this.hue)
    return cb();
  
  color = color.match(/[0-9a-f]{1,2}/g).map(function(c){ return parseInt(c,16); });
  console.log('setting color:',color);
  var self = this;
  var state = lightState.create().on().rgb(color[0],color[1],color[2]);
  this.hue.setGroupLightState(0,state,function(err){
    cb();
  });
};


HueHubDriver.prototype.blink = function(cb) {
  if(!this.hue)
    return cb();

  var self = this;
  self.hue.setGroupLightState(0, {alert : "select"},function(){
    cb();
  });
};

HueHubDriver.prototype.allOn = function(cb) {
  if(!this.hue)
    return cb();
  var self = this;
  this.data.lightval = 'on';
  var state = lightState.create().on().brightness(100).transition(0).effect('none');
  this.hue.setGroupLightState(0,state,function(err){
    if(!err)
      self.state = 'registered';
    cb();
  });
};

HueHubDriver.prototype.allOff = function(cb) {
  if(!this.hue)
    return cb();

  this.data.lightval = 'off';
  var state = lightState.create().off().transition(0);
  this.hue.setGroupLightState(0,state,function(){
    return cb();
  });
};

HueHubDriver.prototype.colorLoop = function(cb) {
  if(!this.hue)
    return cb();
  
  var self = this;
  this.data.lightval = 'on';
  var state = lightState.create().on().brightness(100).transition(0).effect('colorloop');
  this.hue.setGroupLightState(0,state,function(err){
    if(!err)
      self.state = 'colorloop';
    cb();
  });
};

HueHubDriver.prototype.brightness = function(brightness,cb) {
  if(!this.hue)
    return cb();

  var state = lightState.create().brightness(brightness);
  this.hue.setGroupLightState(0,state,function(err){
    cb();
  });
};


HueHubDriver.prototype._lightExists = function(light) {
  return (this.lights.filter(function(l){
    return (l.id === light.id);
  }).length > 0);
};

HueHubDriver.prototype.findLights = function(cb) {
  if(!this.hue)
    return cb();

  var self = this;

  this.hue.lights(function(err, res) {
    if (err)
      return cb();

    res.lights.forEach(function(light){
      if(self._lightExists(light))
        return;

      self.lights.push(light);
      self._newLight(light,self.hue);
    });
    
    cb();
  });
};
