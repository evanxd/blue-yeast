# BlueYeast
A wrapper for BLE APIs in FxOS. It help developers handle BLE things easier.

## How to Install
1. Declare bluetooth-helper as dependency module in `bower.json`. Please check [bower.json](http://bower.io/docs/creating-packages/).
2. Download the module: `bower install`.
3. Import the module in `<head>` in HTML file. `html<script src="bower_components/bluetooth-helper/lib/bluetooth_helper.js"></script>`
4. Done.

## How to Use
### Connect Device
```js
var ble = Bluetooth.addDevice('BT_NAME', 'e4:a9:35:a4:e:10');
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
* API design and implement: https://gist.github.com/evanxd/e23c805724cda59b8469
