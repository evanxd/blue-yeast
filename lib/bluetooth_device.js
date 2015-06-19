/* global EventEmitter2 */
'use strict';

(function(exports) {
  function BluetoothDevice(name, address) {
    this.name = name;
    this.address = address;
  }

  BluetoothDevice.prototype = Object.create(EventEmitter2.prototype);

  ['writeCharacteristic', 'notifyCharacteristic'].forEach(function(item) {
    Object.defineProperty(BluetoothDevice.prototype, item, {
      set: function(value) {
        this['_' + item] = value;
      },
      get: function() {
        return this['_' + item];
      }
    });
  });

  BluetoothDevice.prototype.send = function(data) {
    data = this._parseHexString(data);
    this.writeCharacteristic.writeValue(data);
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
