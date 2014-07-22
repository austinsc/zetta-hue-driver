var zetta = require('zetta');
var Hue = require('../index');

zetta()
  .name('local')
  .expose('*')
  .use(Hue)
  .listen(3000, function(err) {
    if(err) {
      console.log(err);
    }
    console.log('Listening on http://localhost:3000/');
  });
