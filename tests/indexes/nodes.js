if (process.env.TEST_VERSION === 'umd') {
   module.exports = require('./eventnet').nodes;
} else {
   module.exports = require('../../src/nodes/index');
}
