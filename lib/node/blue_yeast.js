/* global require,exports */
'use strict';

var noble = require('noble');
var BluetoothDevice = require('./bluetooth_device').BluetoothDevice;

(function(exports) {
  var BLE_SERVICE_UUID = '713d0000503e4c75ba943148f18d941e';
  var BLE_RX_UUID = '713d0003503e4c75ba943148f18d941e';
  var BLE_TX_UUID = '713d0002503e4c75ba943148f18d941e';
  //var BLE_SERVICE_UUID = '713d0000-503e-4c75-ba94-3148f18d941e';
  //var BLE_RX_UUID = '713d0003-503e-4c75-ba94-3148f18d941e';
  //var BLE_TX_UUID = '713d0002-503e-4c75-ba94-3148f18d941e';
  // The timeout to connect next device. It's used for workaround.
  var CONNECTING_TIMEOUT = 1000;
  //var bluetooth = navigator.mozBluetooth;
  BlueYeast.prototype.CCCD_UUID = '00002902-0000-1000-8000-00805f9b34fb';
  BlueYeast.prototype._devices = null;
  BlueYeast.prototype._scan = null;
  BlueYeast.prototype._isScanning = false;

  function BlueYeast() {
    this._devices = [];
  }

  // TODO: Connect multiple devices at one time.
  BlueYeast.prototype.connect = function(name, address) {
    var device = new BluetoothDevice(name, address);
    // TODO: Pop the device from array once it is disconnected.
    this._devices.push(device);
    this._startScan();
    return device;
  };

  BlueYeast.prototype._startScan = function() {
    if (this._isScanning) {
      return;
    }

    this._isScanning = true;
    if (noble.state == 'poweredOn') {
      noble.on('discover', this._handleDevicefound.bind(this));
      noble.startScanning();
    } else {
      noble.on('stateChange', this._handleStatechanged.bind(this));
    }

  };

  // Currently, we cannot stop scan, or the devices don't work correctly.
  BlueYeast.prototype._stopScan = function() {
    if (!this._isScanning) {
      return;
    }
    this._isScanning = false;
    noble.stopScanning();
    //noble.removeEventListener('discover', this._handleDevicefound);
  };

  BlueYeast.prototype._handleStatechanged = function() {
    if (noble.state == 'poweredOn') {
      noble.startScanning();
      noble.on('discover', this._handleDevicefound.bind(this));
      //noble.removeEventListener('stateChange', this._handleStatechanged);
    }
  };

  BlueYeast.prototype._handleDevicefound = function(peripheral) {
    var devices = this._devices.filter(function(item) {
      return (item.address === peripheral.address ||
        item.name === peripheral.advertisement.localName) &&
        peripheral.state !== 'connected';
    });
    if (devices && devices.length > 0) {
      this._stopScan();
      var self = this;
      // XXX: Workaround to connect multiple devices correctly.
      setTimeout(function() {
        devices[0].client = peripheral;
        peripheral.connect(function() {
          self._discoverServices(devices[0], peripheral);
        });
      }, CONNECTING_TIMEOUT * this._devices.length);
    }
  };

  BlueYeast.prototype._discoverServices = function(device, client) {
    try {
      client.discoverServices(
        [BLE_SERVICE_UUID],
        function(error, services) {
          services[0].discoverCharacteristics([BLE_RX_UUID, BLE_TX_UUID],
            function(error, characteristics) {
              device.writeCharacteristic = characteristics[0];
              device.notifyCharacteristic = characteristics[1];
              device.emit('connect', device);
            });
        });
    } catch (e) {
      console.error(e);
    }
  };

  exports.Bluetooth = new BlueYeast();
  // For testing.
  exports.BlueYeast = BlueYeast;
}(exports));
