let eventnet;
if (process.env.TEST_VERSION === 'umd') {
   console.log('Testing UMD version...');
   eventnet = require('../../build/default/umd/eventnet.min');
} else {
   eventnet = require('../../src/entry');
}
const tslib = require("tslib");
tslib.__exportStar(eventnet, exports);
