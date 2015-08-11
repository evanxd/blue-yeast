# BlueYeast
A wrapper for BLE APIs in FxOS. It help developers handle BLE things easier.

## How to Install for FxOS
1. Declare blue-yeast as dependency module in `bower.json`. Please check [bower.json](http://bower.io/docs/creating-packages/).
2. Download the module: `bower install`.
3. Import the module in `<head>` in HTML file. `html<script src="bower_components/blue-yeast/lib/fxos/blue_yeast.js"></script>`
4. Done.

## How to Install for node.js
1. Declare blue-yeast as dependency module in `package.json`. Please check [package.json](https://docs.npmjs.com/files/package.json).
2. Download the module: `npm install`.
3. Import the module in your script `var Bluetooth = require('blue-yeast').Bluetooth;`
4. Done.

## How to Use
### Connect Device
```js
var ble = Bluetooth.connect('BT_NAME', 'e4:a9:35:a4:e:10');
```

### Send Data
```js
ble.on('connected', function() {
  // You need to send one byte or more data in HEX format at one time.
  ble.send('EE');
});
```

### Subscribe Notifications
```js
ble.startNotifications();
ble.on('data', function(evt) {
  console.log('data: ' + JSON.stringify(evt));
});
```

### Reconnect Device
```js
ble.disconnected();
ble.on('disconnected', function() {
  ble.connect();
})
```

## Ongoing Work
* Design and implement API: https://gist.github.com/evanxd/e23c805724cda59b8469
