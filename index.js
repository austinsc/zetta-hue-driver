var util = require('util')
  , Scout = require('zetta').Scout
  , hue = require("node-hue-api")
  , HueApi = require("node-hue-api").HueApi
  , HueHubDriver = require('./hub')
  , HueBulbDriver = require('./bulb');

var HueScout = module.exports = function() {
  this.interval = 15000;
  Scout.call(this);
};
util.inherits(HueScout, Scout);

HueScout.prototype.init = function(next) {
  // start search logic
  this.search();
  setInterval(this.search.bind(this),this.interval);
  next();
};

HueScout.prototype.search = function() {
  var self = this;
  hue.locateBridges(function(err, hubs) {
    if (err){
      console.error(err);
      return;
    }
    hubs.forEach(function(hueHub){
      self.foundHub(hueHub);
    });
  });
};

HueScout.prototype.foundHub = function(data) {
  var self = this;
  var hubQuery = this.server.where({ type: 'huehub', hubId: data.id });
  this.server.find(hubQuery, function(err, results){
    var huehub = null;
    if (results.length > 0) {
      data.auth = results[0].auth;
      huehub = self.provision(results[0], HueHubDriver, data);
    } else {
      huehub = self.discover(HueHubDriver, data);
    }
    
    if (huehub) {
      huehub.onDiscoveredLight = self.foundLight.bind(self);
    }
  });
};

HueScout.prototype.foundLight = function(data, hue) {
  var self = this;
  var hubQuery = this.server.where({ type: 'huebulb', bulbId: data.id });
  this.server.find(hubQuery, function(err, results){
    if (err) {
      return;
    }
    if (results.length > 0) {
      self.provision(results[0], HueBulbDriver, data, hue);
    } else {
      self.discover(HueBulbDriver, data, hue);
    }
  });
};
