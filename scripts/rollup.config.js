const sourcemaps = require('rollup-plugin-sourcemaps');
const json = require('rollup-plugin-json');
const { banner } = require('./util');

const [entry, version] = process.env.TARGET.split('/');

console.assert(
   ~['esm-browser', 'umd'].indexOf(version),
   `${entry}: [rollup] Invalid version ${version}`
);

module.exports = {
   input: `build/${entry}/esm/entry.js`,
   external: ['ws'],
   plugins: [
      json(),
      sourcemaps(),
   ],

   output: {
      file: `build/${entry}/${version}/eventnet.js`,
      format: version === 'umd' ? 'umd' : 'esm',
      globals: {
         ws: 'WebSocket',
      },
      name: 'eventnet',
      banner,
      sourcemap: true,
   }
};
