var zetta = require('zetta');
var Hue = require('../index');

zetta()
  .use(Hue)
  .listen(1337);
