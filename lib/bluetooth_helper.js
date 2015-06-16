/* global EventEmitter2 */
'use strict';

(function(exports) {
  var BLE_SERVICE_UUID = '713d0000-503e-4c75-ba94-3148f18d941e';
  var BLE_RX_UUID = '713d0003-503e-4c75-ba94-3148f18d941e';
  var BLE_TX_UUID = '713d0002-503e-4c75-ba94-3148f18d941e';
  var bluetooth = navigator.mozBluetooth;

  function BluetoothHelper(name, address) {
    this.name = name;
    this.address = address;
  }

  BluetoothHelper.prototype = Object.create(EventEmitter2.prototype);

  BluetoothHelper.prototype.address = null,
  BluetoothHelper.prototype.name = null,
  BluetoothHelper.prototype.isConnected = false,
  BluetoothHelper.prototype._bluetooth = null,
  BluetoothHelper.prototype._gatt = null,
  BluetoothHelper.prototype._writeChar = null,
  BluetoothHelper.prototype._notifyChar = null,

  BluetoothHelper.prototype.send = function(data) {
    data = this._parseHexString(data);
    this._writeChar.writeValue(data);
  };

  BluetoothHelper.prototype._parseHexString = function(str) {
    var arrayBuffer = new ArrayBuffer(Math.ceil(str.length / 2));
    var uint8Array = new Uint8Array(arrayBuffer);
    for (var i = 0, j = 0; i < str.length; i += 2, j++) {
      uint8Array[j] = parseInt(str.substr(i, 2), 16);
    }
    return arrayBuffer;
  };

  BluetoothHelper.prototype.connect = function() {
    if (bluetooth.defaultAdapter) {
      return bluetooth.defaultAdapter.startDiscovery().catch(() => {
        // Retry to connect the BLE server if failed.
        this.connect();
      }).then(discovery => {
        discovery.addEventListener('devicefound',
          this._handleDevicefound.bind(this));
      }).catch(() => {
        // Retry to connect the BLE server if failed.
        this.connect();
      });
    } else {
      bluetooth.addEventListener('attributechanged',
        this._handleAttributechanged.bind(this));
    }
  };

  BluetoothHelper.prototype.disconnect = function() {
    if (this._gatt) {
      return this._gatt.disconnect().then(() => {
        return bluetooth.defaultAdapter.stopDiscovery();
      }).then(() => {
        this.emit('disconnected');
        this.isConnected = false;
      });
    } else {
      return Promise.reject('GATT is undefined.'); 
    }
  };

  BluetoothHelper.prototype._handleAttributechanged = function(evt) {
    for (var key in evt.attrs) {
      switch (evt.attrs[key]) {
        case 'defaultAdapter':
          bluetooth.removeEventListener('attributechanged',
            this._handleAttributechanged);
          this.connect();
          break;
      }
    }
  };

  BluetoothHelper.prototype._handleDevicefound = function(evt) {
    var devcie = evt.device;
    var gatt = devcie.gatt;
    this._gatt = gatt;
    if (devcie.name === this.name ||
        devcie.address === this.address) {
      this.name = devcie.name;
      this.address = devcie.address;
      gatt.connect().then(() => {
        return this._discoverServices();
      });
    }
  };

  BluetoothHelper.prototype._discoverServices = function() {
    var gatt = this._gatt;
    return gatt.discoverServices().then(() => {
      var service = gatt.services.find(function(service) {
        return service.uuid === BLE_SERVICE_UUID;
      });
      this._writeChar =
        service.characteristics.find(function(characteristic) {
          return characteristic.uuid === BLE_RX_UUID;
        });
      this._notifyChar =
        service.characteristics.find(function(characteristic) {
          return characteristic.uuid === BLE_TX_UUID;
        });
      if (this._notifyChar && Array.isArray(this._notifyChar.descriptors)) {
        this.emit('connected');
        this.isConnected = true;
      } else {
        // Retry to discover services if failed.
        this._discoverServices();
      }
    });
  };

  exports.BluetoothHelper = BluetoothHelper;
}(window));
