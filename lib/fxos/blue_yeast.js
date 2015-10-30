/* global process,require,BluetoothDevice */
'use strict';
if (process) {
  require('./bluetooth_device');
}

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
  BlueYeast.prototype.connect = function(name, address, options) {
    if (options) {
      if (options.service_uuid) {
        BLE_SERVICE_UUID = options.service_uuid;
      }
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
    if (bluetooth.defaultAdapter) {
      // For stability, we use startDiscovery to instead of startLeScan.
      var self = this;
      return bluetooth.defaultAdapter.startLeScan([]).then(function(scan) {
        self._isScanning = true;
        self._scan = scan;
        scan.addEventListener('devicefound', function(device) {
          self._handleDevicefound(device);
        });
      }).catch(function(e) {
        self._isScanning = false;
        throw e;
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
    var self = this;
    bluetooth.defaultAdapter.stopLeScan(this._scan).then(function() {
      self._isScanning = false;
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
    var device = evt.device;
    var gatt = device.gatt;
    device = this._devices.find(function(item) {
      return (item.address === device.address ||
        item.name === device.name) &&
        !device.paired;
    });
    if (device) {
      this._stopScan();
      var self = this;
      // XXX: Workaround to connect multiple devices correctly.
      setTimeout(function() {
        device.gatt = gatt;
        gatt.connect().then(function() {
          self._discoverServices(device, gatt);
        });
      }, CONNECTING_TIMEOUT * this._devices.length);
    }
  };

  BlueYeast.prototype._discoverServices = function(device, gatt) {
    return gatt.discoverServices().then(function() {
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
      device.writeCharacteristic = writeCharacteristic;
      device.notifyCharacteristic = notifyCharacteristic;
      device.emit('connect', device);
    });
  };

  exports.Bluetooth = new BlueYeast();
  // For testing.
  exports.BlueYeast = BlueYeast;
}(window));
