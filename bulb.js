var util = require('util');
var lightState = require("node-hue-api").lightState;
var HueDevice = require('./hue_device');

var HueBulb = module.exports = function(data, hue) {
  this.bulbId = data.id;
  this.bulbName = data.name;
  HueDevice.call(this, hue);
};
util.inherits(HueBulb, HueDevice);

HueBulb.prototype.init = function(config) {
  this._init(config);
  
  config
    .state('off')
    .type('huebulb')
    .name('Hue Bulb ' + this.bulbName);
};

HueBulb.prototype.setState = function(state, cb) {
  this._hue.setLightState(this.bulbId, state, cb);
};


