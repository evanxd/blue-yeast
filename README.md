# bluetooth-helper
A wrapper for BLE APIs in FxOS. It help developers handle BLE things easier.

## How to Install
1. Declare bluetooth-helper as dependency module in `bower.json`. Please check [bower.json](http://bower.io/docs/creating-packages/).
2. Download the module: `bower install`.
3. Import the module in `<head>` in HTML file. `html<script src="bower_components/bluetooth-helper/lib/bluetooth_helper.js"></script>`
4. Done.

## How to Use
### Connect the device.
```js
var ble = new BluetoothHelper({
  // Need BLE device's name or address to connect it.
  name: 'BT_NAME',
  // address: 'e4:a9:35:a4:ee:10'
});
ble.connect();
```
### Send data to device after connected.
```js
ble.on('connected', function() {
  // You need to send one byte or more data in HEX format at one time.
  ble.send('EE');
});
```
### Reconnect the device.
```js
ble.disconnected();
ble.on('disconnected', function() {
  ble.connect();
})
```
