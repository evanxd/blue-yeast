/* global process,require,ble */
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

  BluetoothDevice.prototype.address = null;
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
      this._writeData(data.buffer);
    } else if (data instanceof ArrayBuffer) {
      this._writeData(data, false);
    } else if (data instanceof String) {
      this._writeData(this._parseHexString(data));
    } else if (data) {
      throw 'Unsupported data type ' + data.constructor.name +
      ', must be Uint8Array or Hex String';
    } else {
      throw 'Data cannot be empty';
    }
  };

  BluetoothDevice.prototype._writeData = function(data) {
    var self = this;
    ble.writeWithoutResponse(this.address, this.writeCharacteristic.service,
      self.writeCharacteristic.characteristic, data, function() {
      },
      function(e) {
        throw e;
      });
  };

  BluetoothDevice.prototype.startNotifications = function() {
    if (this._isNotificationsStarted) {
      return;
    } else {
      this._isNotificationsStarted = true;
    }

    var self = this;
    ble.startNotification(this.address, this.notifyCharacteristic.service,
      this.notifyCharacteristic.characteristic, function(value) {
        self.emit('data', value);
      }, function(e) {
        throw e;
      });
  };

  BluetoothDevice.prototype.stopNotifications = function() {
    var self = this;
    ble.stopNotification(this.address, this.notifyCharacteristic.service,
      this.notifyCharacteristic.characteristic, function() {
        self._isNotificationsStarted = false;
      }, function(e) {
        throw e;
      });
  };

  BluetoothDevice.prototype.disconnect = function() {
    return new Promise(function(resolve, reject) {
      ble.stopNotification(this.address, resolve, reject);
    });
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
