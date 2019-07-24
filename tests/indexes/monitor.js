if (process.env.TEST_VERSION === 'umd') {
   module.exports = require('./eventnet').monitor;
} else {
   module.exports = require('../src/monitor/index');
}
