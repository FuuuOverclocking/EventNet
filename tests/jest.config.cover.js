const config = require('./jest.config');

module.exports = config;

Object.assign(config, {
   // Indicates whether the coverage information should be collected while executing the test
   collectCoverage: true,

   // An array of glob patterns indicating a set of files for which coverage information should be collected
   collectCoverageFrom: [
      "src/**/*.ts",
   ],

   // The directory where Jest should output its coverage files
   coverageDirectory: "coverage",
});
