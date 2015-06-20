/* global BluetoothDevice */
'use strict';

(function(exports) {
  var BLE_SERVICE_UUID = '713d0000-503e-4c75-ba94-3148f18d941e';
  var BLE_RX_UUID = '713d0003-503e-4c75-ba94-3148f18d941e';
  var BLE_TX_UUID = '713d0002-503e-4c75-ba94-3148f18d941e';
  var bluetooth = navigator.mozBluetooth;

  function BluetoothHelper() {
    this._devices = [];
    this.startScan();
  }

  // The timeout to connect next device. It's used for workaround.
  BluetoothHelper.CONNECTING_TIMEOUT = 700;

  BluetoothHelper.prototype._devices = null,
  BluetoothHelper.prototype._gatt = null,
  BluetoothHelper.prototype._isScanning = false,

  BluetoothHelper.prototype.addDevice = function(name, address) {
    var device = new BluetoothDevice(name, address);
    // TODO: Pop the device from array once it is disconnected.
    this._devices.push(device);
    return device;
  },

  BluetoothHelper.prototype.startScan = function() {
    if (this._isScanning) {
      return;
    }
    if (bluetooth.defaultAdapter) {
      // For stability, We use startScan to instead of startDiscovery.
      return bluetooth.defaultAdapter.startLeScan([]).then(scan => {
        this._isScanning = true;
        this._scan = scan;
        scan.addEventListener('devicefound',
          this._handleDevicefound.bind(this));
      }).catch(() => {
        this.startScan();
      });
    } else {
      bluetooth.addEventListener('attributechanged',
        this._handleAttributechanged.bind(this));
    }
  };

  BluetoothHelper.prototype.stopScan = function() {
    if (!this._isScanning) {
      return;
    }
    if (this._gatt) {
      return this._gatt.disconnect().then(() => {
        return bluetooth.defaultAdapter.stopLeScan(this._scan);
      }).then(() => {
        this._isScanning = false;
        this.emit('scanningstoped');
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
          this.startScan();
          break;
      }
    }
  };

  BluetoothHelper.prototype._handleDevicefound = function(evt) {
    var devcie = evt.device;
    var gatt = devcie.gatt;
    this._gatt = gatt;
    devcie = this._devices.find(function(item) {
      return (item.address === devcie.address ||
        item.name === devcie.name) &&
        !devcie.paired;
    });
    if (devcie) {
      // XXX: Workaround to connect multiple devices correctly.
      setTimeout(() => {
        gatt.connect().then(() => {
          this._discoverServices(devcie, gatt);
        });
      }, BluetoothHelper.CONNECTING_TIMEOUT * this._devices.length);
    }
  };

  BluetoothHelper.prototype._discoverServices = function(devcie, gatt) {
    return gatt.discoverServices().then(() => {
      var service = gatt.services.find(function(service) {
        return service.uuid === BLE_SERVICE_UUID;
      });
      var writeCharacteristic =
        service.characteristics.find(function(characteristic) {
          return characteristic.uuid === BLE_RX_UUID;
        });
      var notifyCharacteristic =
        service.characteristics.find(function(characteristic) {
          return characteristic.uuid === BLE_TX_UUID;
        });
      devcie.writeCharacteristic = writeCharacteristic;
      devcie.notifyCharacteristic = notifyCharacteristic;
      devcie.emit('connected', devcie);
    });
  };

  exports.Bluetooth = new BluetoothHelper();
  // For testing.
  exports.BluetoothHelper = BluetoothHelper;
}(window));
