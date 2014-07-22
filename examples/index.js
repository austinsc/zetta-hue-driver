var zetta = require('zetta');
var Hue = require('../index');

var app = zetta()
app.id = 'F76457112-8056-4955-a860-4e62c81a6a8b';

app.name('local')
  .expose('*')
  .use(Hue)
  .listen(3000, function(err) {
    if(err) {
      console.log(err);
    }
    console.log('Listening on http://localhost:3000/');
  });
