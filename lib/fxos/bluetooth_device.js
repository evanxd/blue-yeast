/* global process,require,Bluetooth */
'use strict';
if (process) {
  var EventEmitter2 = require('eventemitter2').EventEmitter2;
}

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

  /**
   * Send data to BLE device in bytes.
   * @param {ArrayBuffer|Uint8Array} data Data to be sent,
   * accept Uint8Array, ArrayBuffer or String in hex format.
   * @throws "Data can't be empty" if data is null|undfined
   * @throws "Unsupported data type" if data is not String|Uint8Array
   */
  BluetoothDevice.prototype.send = function(data) {
    if (data instanceof Uint8Array) {
      this.writeCharacteristic.writeValue(data.buffer);
    } else if (data instanceof ArrayBuffer) {
      this.writeCharacteristic.write(data, false);
    } else if (data instanceof String) {
      this.writeCharacteristic.writeValue(this._parseHexString(data));
    } else if (data) {
      throw 'Unsupported data type ' + data.constructor.name +
        ', must be Uint8Array or Hex String';
    } else {
      throw 'Data cannot be empty';
    }
  };

  BluetoothDevice.prototype.startNotifications = function() {
    if (this._isNotificationsStarted) {
      return;
    } else {
      this._isNotificationsStarted = true;
    }
    var characteristic = this.notifyCharacteristic;
    var self = this;
    this.gatt.addEventListener('characteristicchanged', function(evt) {
      self.emit('data', evt.characteristic.value);
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

  BluetoothDevice.prototype.disconnect = function() {
    return this.gatt.disconnect();
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
