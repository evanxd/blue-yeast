/* global process,require,exports */
'use strict';

if (process) {
  if (process.browser) {
    if (window) {
      if (window.cordova) {
        if (window.cordova.platformId == 'firefoxos') {
          require('./fxos/blue_yeast');
        } else {
          require('./cordova/blue_yeast');
        }
      } else {
        //TODO: check for different browsers, currently only support fxos
        require('./fxos/blue_yeast');
      }
    } else {
      throw 'This implementation is for browser but no window object found.';
    }
  } else {
    exports.Bluetooth = require('./node/blue_yeast').Bluetooth;
  }
}
