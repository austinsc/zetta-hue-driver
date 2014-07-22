var util = require('util');
var Device = require('zetta').Device;
var HueApi = require("node-hue-api").HueApi;
var lightState = require("node-hue-api").lightState;

var HueHub = module.exports = function(data) {
  this.hubId = data.id;
  this.ipAddress = data.ipaddress;
  if (data.auth) {
    this.auth = data.auth
    this._hue = new HueApi(this.ipAddress, this.auth);
  }
  Device.call(this);
};
util.inherits(HueHub, Device);

HueHub.prototype.init = function(config) {
  var state = (this.auth) ? 'registered' : 'unregistered';
  config
    .type('huehub')
    .state(state)
    .name('Hue Hub')
    .when('unregistered', { allow: ['register'] })
    .when('registered', { allow: ['blink', 'find-lights', 'all-on', 'all-off', 'brightness', 'color', 'color-loop'] })
    .when('colorloop', { allow: ['blink', 'find-lights', 'all-on', 'all-off', 'brightness', 'color'] })
    .map('register', this.register)
    .map('blink', this.blink)
    .map('all-on',this.allOn)
    .map('all-off',this.allOff)
    .map('find-lights',this.findLights)
    .map('color-loop',this.colorLoop)
    .map('color',this.color,[{type:'color', name: 'color'}])
    .map('brightness',this.brightness,[{type: 'number', name: 'brightness'}]);
  
  if (this.auth) {
    this.findLights();
    setInterval(this.findLights.bind(this), 15000);
  }
};

HueHub.prototype.register = function(cb) {
  var self = this;
  var hue = new HueApi();
  hue.createUser(this.ipAddress, null, null, function(err, user) {
    if (err) {
      return cb(null);
    }

    self.auth = user;
    self.state = 'registered';
    self._hue = new HueApi(self.ipAddress, self.auth);
    self.save(function() {
      self.findLights(cb);
      setInterval(self.findLights.bind(self), 15000);
    });
  });
};

HueHub.prototype.onDiscoveredLight = function(light) {};

HueHub.prototype.color = function(color,cb){
  if(!this._hue)
    return cb();
  
  color = color.match(/[0-9a-f]{1,2}/g).map(function(c){ return parseInt(c,16); });
  var self = this;
  var state = lightState.create().on().rgb(color[0],color[1],color[2]);
  this._hue.setGroupLightState(0,state,function(err){
    cb();
  });
};


HueHub.prototype.blink = function(cb) {
  if(!this._hue)
    return cb();

  var self = this;
  self._hue.setGroupLightState(0, {alert : "select"},function(){
    cb();
  });
};

HueHub.prototype.allOn = function(cb) {
  if(!this._hue)
    return cb();
  
  var self = this;
  this.data.lightval = 'on';
  var state = lightState.create().on().brightness(100).transition(0).effect('none');
  this._hue.setGroupLightState(0,state,function(err){
    if(!err)
      self.state = 'registered';
    cb();
  });
};

HueHub.prototype.allOff = function(cb) {
  if (!this._hue) {
    return cb();
  }

  var state = lightState.create().off().transition(0);
  this._hue.setGroupLightState(0,state,function(){
    return cb();
  });
};

HueHub.prototype.colorLoop = function(cb) {
  if(!this._hue)
    return cb();
  
  var self = this;
  var state = lightState.create().on().brightness(100).transition(0).effect('colorloop');
  this._hue.setGroupLightState(0, state, function(err) {
    if (!err) {
      self.state = 'colorloop';
    }
    cb();
  });
};

HueHub.prototype.brightness = function(brightness, cb) {
  if (!this._hue) {
    return cb();
  }

  var state = lightState.create().brightness(brightness);
  this._hue.setGroupLightState(0, state, function(err) {
    cb();
  });
};

HueHub.prototype.findLights = function(cb) {
  if (!cb) {
    cb = function() {};
  }
  if (!this._hue) {
    return cb();
  }

  var self = this;
  this._hue.lights(function(err, res) {
    if (err) {
      return cb();
    }

    res.lights.forEach(function(light) {
      self.onDiscoveredLight(light, self._hue);
    });

    cb();
  });
};
