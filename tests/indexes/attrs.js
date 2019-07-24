if (process.env.TEST_VERSION === 'umd') {
   module.exports = require('./eventnet').attrs;
} else {
   module.exports = require('../src/attrs/index');
}
