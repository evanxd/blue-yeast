/* global process,require,exports */
'use strict';

if (process) {
  if (process.browser) {
    require('./fxos/blue_yeast');
  } else {
    exports.Bluetooth = require('./node/blue_yeast').Bluetooth;
  }
}
