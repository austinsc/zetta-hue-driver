var util = require('util');
var Device = require('zetta-device');
var lightState = require('node-hue-api').lightState;

var HueDevice = module.exports = function(hue) {
  this._hue = hue;
  this.colorValue = [0xFF, 0xFF, 0xFF];
  Device.call(this);
};
util.inherits(HueDevice, Device);

HueDevice.prototype._init = function(config) {
  var controls = ['toggel', 'blink', 'color', 'brightness'];

  config
    .when('on', { allow: controls.concat(['turn-off', 'color-loop']) })
    .when('off', { allow: controls.concat(['turn-on', 'color-loop']) })
    .when('colorloop', { allow: controls.concat(['turn-on', 'turn-off']) })
    .map('turn-on', this.turnOn)
    .map('turn-off', this.turnOff)
    .map('toggle', this.toggle)
    .map('blink', this.blink)
    .map('color', this.color, [{ type:'color', name: 'color' }])
    .map('brightness', this.brightness, [{ type: 'number', name: 'brightness' }])
    .map('color-loop', this.colorLoop);
};

HueDevice.prototype.blink = function(cb) {
  this.setState({alert : "select"}, function(){
    cb();
  });
};

HueDevice.prototype.color = function(color, cb) {
  color = color.match(/[0-9a-f]{1,2}/g).map(function(c){ return parseInt(c,16); });
  var self = this;
  var state = lightState.create().on().rgb(color[0], color[1], color[2]);
  this.setState(state, function(err) {
    if (!err) {
      self.colorValue = color;
    }
    cb();
  });
};

HueDevice.prototype.turnOn = function(cb) {
  var self = this;
  var state = lightState.create().on();
  this.setState(state, function(err) {
    if(!err) {
      self.state = 'on';
    }
    cb();
  });
};

HueDevice.prototype.turnOff = function(cb) {
  var self = this;
  var state = lightState.create().off();
  this.setState(state, function(err) {
    if(!err) {
      self.state = 'off';
    }
    cb();  
  });
};

HueDevice.prototype.toggle = function(cb) {
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

HueDevice.prototype.brightness = function(brightness, cb) {
  var state = lightState.create().brightness(brightness);
  this.setState(state, function(err) {
    cb();
  });
};

HueDevice.prototype.colorLoop = function(cb) {
  var self = this;
  var state = lightState.create().on().brightness(100).transition(0).effect('colorloop');
  this.setState(state, function(err) {
    if (!err) {
      self.state = 'colorloop';
    }
    cb();
  });
};

