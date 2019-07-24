if (process.env.TEST_VERSION === 'umd') {
   module.exports = require('./eventnet').connectors;
} else {
   module.exports = require('../../src/connectors/index');
}
