/* global process,require,BluetoothDevice,ble */
'use strict';
if (process) {
  require('./bluetooth_device');
}

(function(exports) {
  //var BLE_SERVICE_UUID = '713d0000-503e-4c75-ba94-3148f18d941e';
  var BLE_RX_UUID = '713d0003-503e-4c75-ba94-3148f18d941e';
  var BLE_TX_UUID = '713d0002-503e-4c75-ba94-3148f18d941e';
  // The timeout to connect next device. It's used for workaround.
  var CONNECTING_TIMEOUT = 1000;

  function BlueYeast() {
    this._devices = [];
  }

  BlueYeast.prototype.CCCD_UUID = '00002902-0000-1000-8000-00805f9b34fb';
  BlueYeast.prototype._devices = null;
  BlueYeast.prototype._isScanning = false;

  // TODO: Connect multiple devices at one time.
  BlueYeast.prototype.connect = function(name, address, options) {
    if (options) {
      if (options.rx_uuid) {
        BLE_RX_UUID = options.rx_uuid;
      }
      if (options.tx_uuid) {
        BLE_TX_UUID = options.tx_uuid;
      }
    }
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
    var self = this;
    ble.startScan([], function(device) {
      self._handleDevicefound(device);
    }, function(e) {
      self._isScanning = false;
      throw e;
    });
  };

  // Currently, we cannot stop scan, or the devices don't work correctly.
  BlueYeast.prototype._stopScan = function() {
    if (!this._isScanning) {
      return;
    }
    var self = this;
    ble.stopScan(function() {
      self._isScanning = false;
    }, function(e) {
      throw e;
    });
  };

  BlueYeast.prototype._handleDevicefound = function(client) {
    var deviceAddr = client.id.toLowerCase();
    var devices = this._devices.filter(function(item) {
      return item.address === deviceAddr || item.name === client.name;
    });
    if (devices.length > 0) {
      this._stopScan();
      var self = this;
      // XXX: Workaround to connect multiple devices correctly.
      setTimeout(function() {
        ble.connect(client.id, function(client) {
          self._discoverServices(devices[0], client);
        }, function(e) {
          throw e;
        });
      }, CONNECTING_TIMEOUT * this._devices.length);
    }
  };

  BlueYeast.prototype._discoverServices = function(device, client) {
    var writeCharacteristics =
      client.characteristics.filter(function(characteristic) {
        return characteristic.characteristic.toLowerCase() === BLE_RX_UUID;
      });
    var notifyCharacteristics =
      client.characteristics.filter(function(characteristic) {
        return characteristic.characteristic.toLowerCase() === BLE_TX_UUID;
      });
    device.address = client.id;
    if (writeCharacteristics.length > 0) {
      device.writeCharacteristic = writeCharacteristics[0];
    }
    if (notifyCharacteristics.length > 0) {
      device.notifyCharacteristic = notifyCharacteristics[0];
    }
    device.emit('connect', device);
  };

  exports.Bluetooth = new BlueYeast();
  // For testing.
  exports.BlueYeast = BlueYeast;
}(window));
