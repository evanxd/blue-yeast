/* global BluetoothDevice */
'use strict';

(function(exports) {
  var BLE_SERVICE_UUID = '713d0000-503e-4c75-ba94-3148f18d941e';
  var BLE_RX_UUID = '713d0003-503e-4c75-ba94-3148f18d941e';
  var BLE_TX_UUID = '713d0002-503e-4c75-ba94-3148f18d941e';
  // The timeout to connect next device. It's used for workaround.
  var CONNECTING_TIMEOUT = 1000;
  var bluetooth = navigator.mozBluetooth;

  function BlueYeast() {
    this._devices = [];
  }

  BlueYeast.prototype.CCCD_UUID = '00002902-0000-1000-8000-00805f9b34fb';
  BlueYeast.prototype._devices = null;
  BlueYeast.prototype._scan = null;
  BlueYeast.prototype._isScanning = false;

  // TODO: Connect multiple devices at one time.
  BlueYeast.prototype.connect = function(name, address) {
    var device = new BluetoothDevice(name, address);
    // TODO: Pop the device from array once it is disconnected.
    this._devices.push(device);
    this._startScan();
    return device;
  },

  BlueYeast.prototype._startScan = function() {
    if (this._isScanning) {
      return;
    }
    if (bluetooth.defaultAdapter) {
      // For stability, we use startDiscovery to instead of startLeScan.
      return bluetooth.defaultAdapter.startDiscovery([]).then(scan => {
        this._isScanning = true;
        this._scan = scan;
        scan.addEventListener('devicefound',
          this._handleDevicefound.bind(this));
      }).catch(() => {
        this._isScanning = false;
        this._startScan();
      });
    } else {
      bluetooth.addEventListener('attributechanged',
        this._handleAttributechanged.bind(this));
    }
  };

  // Currently, we cannot stop scan, or the devices don't work correctly.
  BlueYeast.prototype._stopScan = function() {
    if (!this._isScanning) {
      return;
    }
    bluetooth.defaultAdapter.stopDiscovery(this._scan).then(() => {
      this._isScanning = false;
      this.emit('scanningstop');
    });
  };

  BlueYeast.prototype._handleAttributechanged = function(evt) {
    for (var key in evt.attrs) {
      switch (evt.attrs[key]) {
        case 'defaultAdapter':
          bluetooth.removeEventListener('attributechanged',
            this._handleAttributechanged);
          this._startScan();
          break;
      }
    }
  };

  BlueYeast.prototype._handleDevicefound = function(evt) {
    var gatt = evt.device.gatt;
    var devcie = this._devices.find(function(item) {
      return (item.address === devcie.address ||
        item.name === devcie.name) &&
        !devcie.paired;
    });
    if (devcie) {
      this._stopScan();
      // XXX: Workaround to connect multiple devices correctly.
      setTimeout(() => {
        devcie.gatt = gatt;
        gatt.connect().then(() => {
          this._discoverServices(devcie, gatt);
        });
      }, CONNECTING_TIMEOUT * this._devices.length);
    }
  };

  BlueYeast.prototype._discoverServices = function(devcie, gatt) {
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
      devcie.emit('connect', devcie);
    });
  };

  exports.Bluetooth = new BlueYeast();
  // For testing.
  exports.BlueYeast = BlueYeast;
}(window));
