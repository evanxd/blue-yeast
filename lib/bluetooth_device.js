/* global Bluetooth, EventEmitter2 */
'use strict';

(function(exports) {
  function BluetoothDevice(name, address) {
    this.name = name;
    this.address = address;
  }

  BluetoothDevice.prototype = Object.create(EventEmitter2.prototype);

  BluetoothDevice.prototype.gatt = null;
  BluetoothDevice.prototype.writeCharacteristic = null;
  BluetoothDevice.prototype.notifyCharacteristic = null;
  BluetoothDevice.prototype._isNotificationsStarted = false;

  BluetoothDevice.prototype.send = function(data) {
    data = this._parseHexString(data);
    this.writeCharacteristic.writeValue(data);
  };

  BluetoothDevice.prototype.startNotifications = function() {
    if (this._isNotificationsStarted) {
      return;
    } else {
      this._isNotificationsStarted = true;
    }
    var characteristic = this.notifyCharacteristic;
    this.gatt.addEventListener('characteristicchanged', (evt) => {
      this.emit('data', evt.characteristic.value);
    });
    characteristic.startNotifications();
    var descriptor = characteristic.descriptors.find(function(descriptor) {
      return descriptor.uuid === Bluetooth.CCCD_UUID;
    });
    if (descriptor) {
      var arrayBuffer = new ArrayBuffer(2);
      var uint8Array = new Uint8Array(arrayBuffer);
      uint8Array[0] = 0x01;
      uint8Array[1] = 0x00;
      descriptor.writeValue(arrayBuffer);
    }
  };

  BluetoothDevice.prototype.stopNotifications = function() {
    this._isNotificationsStarted = false;
    this.notifyCharacteristic.stopNotifications();
  };

  BluetoothDevice.prototype._parseHexString = function(str) {
    var arrayBuffer = new ArrayBuffer(Math.ceil(str.length / 2));
    var uint8Array = new Uint8Array(arrayBuffer);
    for (var i = 0, j = 0; i < str.length; i += 2, j++) {
      uint8Array[j] = parseInt(str.substr(i, 2), 16);
    }
    return arrayBuffer;
  };

  exports.BluetoothDevice = BluetoothDevice;
}(window));
