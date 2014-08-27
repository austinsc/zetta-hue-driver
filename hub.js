var util = require('util');
var HueApi = require('node-hue-api').HueApi;
var HueDevice = require('./hue_device');

var HueHub = module.exports = function(data) {
  this.hubId = data.id;
  this.ipAddress = data.ipaddress;

  var hue = new HueApi(this.ipAddress);
  if (data.auth) {
    this.auth = data.auth
    hue = new HueApi(this.ipAddress, this.auth);
  }
  HueDevice.call(this, hue);
};
util.inherits(HueHub, HueDevice);

HueHub.prototype.init = function(config) {
  this._init(config);

  var state = (this.auth) ? 'on' : 'unregistered';
  config
    .type('huehub')
    .state(state)
    .name('Hue Hub')
    .when('unregistered', { allow: ['register'] })
    .map('register', this.register)
    .map('find-lights', this.findLights)

  if (this.auth) {
    this.findLights();
    setInterval(this.findLights.bind(this), 15000);
  }
};

HueHub.prototype.setState = function(state, cb) {
  this._hue.setGroupLightState(0, state, cb);
};

HueHub.prototype.onDiscoveredLight = function(light) {};

HueHub.prototype.register = function(cb) {
  var self = this;
  var hue = new HueApi();
  hue.createUser(this.ipAddress, null, null, function(err, user) {
    if (err) {
      return cb();
    }

    self.auth = user;
    self.state = 'on';
    self._hue = new HueApi(self.ipAddress, self.auth);
    self.save(function() {
      self.findLights(cb);
      setInterval(self.findLights.bind(self), 15000);
    });
  });
};

HueHub.prototype.findLights = function(cb) {
  if (!cb) {
    cb = function() {};
  }

  var self = this;
  
  this._hue.lights()
    .then(function(res) {
      res.lights.forEach(function(light) {
        self.onDiscoveredLight(light, self._hue);
      });
      cb();
    })
    .fail(function(err) {
      console.error('Hue Find Lights:', err);
      return cb();
    })
    .done();
};
