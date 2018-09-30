const rollup = require('rollup');
const clone = require('lodash/cloneDeepWith');
const replace = require('rollup-plugin-replace');
const sourcemaps = require('rollup-plugin-sourcemaps');
// const node_resolve = require('rollup-plugin-node-resolve');

const production_expression_replace_list =
  exports.production_expression_replace_list = {
    'process.env.NODE_ENV': "'production'",
    'config.monitoring': 'false',
  };

const date = new Date();
const banner =
  `/**
 * EventNet v${require('../package.json').version}
 * (c) ${date.getFullYear() > 2018 ? '2018-' + date.getFullYear() : '2018'} X.Y.Z.
 * Released under the MIT License.
 */
`;

//////////////////////////
// Rollup basic config
//////////////////////////
const basic_config = {
  input: {
    // input,
    external: ['ws', 'tslib'],
    // plugins,
  },
  output: {
    // format,
    // file,
    name: 'eventnet',
    banner,
    sourcemap: true,
  },
};

/////////////////////////////////
// ES Module, ECMAScript 5
/////////////////////////////////
const esm5_config = clone(basic_config);
Object.assign(esm5_config.input, {
  input: 'dist/esm5/index.js',
  plugins: [
    replace({
      exclude: 'node_modules/**',
      ...production_expression_replace_list,
    }),
  ],
});
Object.assign(esm5_config.output, {
  file: 'release/esm5/index.js',
  format: 'esm',
});

const esm5_dev_config = clone(basic_config);
Object.assign(esm5_dev_config.input, {
  input: 'dist/esm5_dev/index.js',
});
Object.assign(esm5_dev_config.output, {
  file: 'release/esm5/dev/index.js',
  format: 'esm',
});

exports.esm5 = async function esm5() {
  const bundle = await rollup.rollup(esm5_config.input);
  await bundle.write(esm5_config.output);
  const dev_bundle = await rollup.rollup(esm5_dev_config.input);
  await dev_bundle.write(esm5_dev_config.output);
}

/////////////////////////////////
// CommonJS Module, ECMAScript 5
/////////////////////////////////
const cjs_config = clone(basic_config);
Object.assign(cjs_config.input, {
  input: 'dist/esm5/index.js',
  plugins: [
    replace({
      exclude: 'node_modules/**',
      ...production_expression_replace_list,
    }),
  ],
});
Object.assign(cjs_config.output, {
  file: 'release/cjs/index.js',
  format: 'cjs',
});

const cjs_dev_config = clone(basic_config);
Object.assign(cjs_dev_config.input, {
  input: 'dist/esm5_dev/index.js',
});
Object.assign(cjs_dev_config.output, {
  file: 'release/cjs/dev/index.js',
  format: 'cjs',
});

exports.cjs = async function cjs() {
  const bundle = await rollup.rollup(cjs_config.input);
  await bundle.write(cjs_config.output);
  const dev_bundle = await rollup.rollup(cjs_dev_config.input);
  await dev_bundle.write(cjs_dev_config.output);
}

/////////////////////////////////
// ES Module, ECMAScript 2015
/////////////////////////////////
const esm2015_config = clone(basic_config);
Object.assign(esm2015_config.input, {
  input: 'dist/esm2015/index.js',
  plugins: [
    replace({
      exclude: 'node_modules/**',
      ...production_expression_replace_list,
    }),
  ],
});
Object.assign(esm2015_config.output, {
  file: 'release/esm2015/index.js',
  format: 'esm',
});

const esm2015_dev_config = clone(basic_config);
Object.assign(esm2015_dev_config.input, {
  input: 'dist/esm2015_dev/index.js',
});
Object.assign(esm2015_dev_config.output, {
  file: 'release/esm2015/dev/index.js',
  format: 'esm',
});

exports.esm2015 = async function esm2015() {
  const bundle = await rollup.rollup(esm2015_config.input);
  await bundle.write(esm2015_config.output);
  const dev_bundle = await rollup.rollup(esm2015_dev_config.input);
  await dev_bundle.write(esm2015_dev_config.output);
}
