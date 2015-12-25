/* global process,require,Buffer,exports */
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

  BluetoothDevice.prototype.client = null;
  BluetoothDevice.prototype.writeCharacteristic = null;
  BluetoothDevice.prototype.notifyCharacteristic = null;
  BluetoothDevice.prototype._isNotificationsStarted = false;

  /**
   * Send data to BLE device in bytes.
   * @param {Buffer|Uint8Array} data Data to be sent,
   * accept Uint8Array or String in hex format.
   * @throws "Data can't be empty" if data is null|undfined
   * @throws "Unsupported data type" if data is not String|Uint8Array
   */
  BluetoothDevice.prototype.send = function(data) {
    if (data instanceof Uint8Array) {
      this.writeCharacteristic.write(this._toBuffer(data.buffer), false);
    } else if (data instanceof Buffer) {
      this.writeCharacteristic.write(data, false);
    } else if (data instanceof String) {
      this.writeCharacteristic.write(this._parseHexString(data), false);
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
    }
    this._isNotificationsStarted = true;
    this.notifyCharacteristic.notify(true);
    var self = this;
    this.notifyCharacteristic.on('data', function(data, isNotification) {
      if (isNotification) {
        self.emit('data', new Uint8Array(self._toArrayBuffer(data)));
      }
    });
  };

  BluetoothDevice.prototype.stopNotifications = function() {
    this._isNotificationsStarted = false;
    this.notifyCharacteristic.notify(false);
  };

  BluetoothDevice.prototype.disconnect = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.client.disconnect(reject);
      resolve();
    });
  };

  BluetoothDevice.prototype._parseHexString = function(str) {
    var arrayBuffer = new ArrayBuffer(Math.ceil(str.length / 2));
    var uint8Array = new Uint8Array(arrayBuffer);
    for (var i = 0, j = 0; i < str.length; i += 2, j++) {
      uint8Array[j] = parseInt(str.substr(i, 2), 16);
    }
    return this._toBuffer(arrayBuffer);
  };

  BluetoothDevice.prototype._toBuffer = function(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
    }
    return buffer;
  };

  BluetoothDevice.prototype._toArrayBuffer = function(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
    }
    return ab;
  };

  exports.BluetoothDevice = BluetoothDevice;
}(exports));
