# bluetooth-helper
A wrapper for BLE APIs in FxOS. It help developers handle BLE things easier.

## How to Install
Just declare the library in `<head>` in HTML file and done.
```html
<head>
  <script src="path/to/bluetooth_helper.js"></script>
</head>
```

## How to Use
Send one byte data `EE` to BLE device.
```js
var ble = new BluetoothHelper({
  // Need BLE device's name or address to connect it.
  name: 'BT_NAME',
  // address: 'e4:a9:35:a4:ee:10'
});
ble.on('connected', function() {
  // You need to send one byte or more data at one time.
  ble.send('EE');
});
```
