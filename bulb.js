var util = require('util');
var Device = require('zetta').Device;
var lightState = require("node-hue-api").lightState;

var HueBulb = module.exports = function(data, hue) {
  this.bulbId = data.id;
  this.bulbName = data.name;
  this._hue = hue;
  Device.call(this);
};
util.inherits(HueBulb, Device);

HueBulb.prototype.init = function(config) {
  config
    .type('huebulb')
    .name('Hue Hulb ' + this.bulbName)
    .state('off')
    .when('on', { allow: ['turn-off', 'toggle', 'blink', 'color'] })
    .when('off', { allow: ['turn-on', 'toggle', 'blink', 'color'] })
    .when('blink', { allow: ['turn-on', 'toggle', 'blink', 'color'] })
    .map('turn-on', this.turnOn)
    .map('turn-off', this.turnOff)
    .map('toggle', this.toggle)
    .map('blink', this.blink)
    .map('color', this.color, [{ type:'color', name: 'color' }]);
};

HueBulb.prototype.blink = function(cb) {
  if (!this._hue) {
    return cb();
  }

  var self = this;
  this._hue.setLightState(this.bulbId, { alert: 'select' }, function(err){
    cb();
  });
};


HueBulb.prototype.color = function(color, cb) {
  if (!this._hue) {
    return cb();
  }

  color = color.match(/[0-9a-f]{1,2}/g).map(function(c){ return parseInt(c,16); });
  var self = this;
  var state = lightState.create().on().rgb(color[0], color[1], color[2]);
  this._hue.setLightState(this.bulbId, state, function(err) {
    cb();
  });
};

HueBulb.prototype.turnOn = function(cb) {
  if (!this._hue) {
    return cb();
  }

  var self = this;
  self.state = 'on';
  var state = lightState.create().on();
  this._hue.setLightState(this.bulbId, state, function(err) {
    cb();
  });
};

HueBulb.prototype.turnOff = function(cb) {
  if (!this._hue) {
    return cb();
  }

  var self = this;
  self.state = 'off';
  var state = lightState.create().off();
  this._hue.setLightState(this.bulbId, state, function(err) {
    cb();  
  });
};

HueBulb.prototype.toggle = function(cb) {
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
