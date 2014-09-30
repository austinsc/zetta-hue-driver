# Phillip's Hue Zetta Driver

[Zetta](http://zettajs.io) device package for Phillips Hue Driver, use this to discover Hue hubs and bulbs on your [Zetta](http://zettajs.io) platform. Uses the [Node Hue Api](https://github.com/peter-murray/node-hue-api) from Peter Murray to communicate with Hue hub and bulbs.

## Install

```
npm install zetta-hue-driver
```

## Usage

```js
var zetta = require('zetta');
var Hue = require('zetta-hue-driver');

zetta()
  .use(Hue)
  .listen(1337);
```

## License

MIT
