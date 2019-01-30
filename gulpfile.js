/**
 * This file contains the compilation process of EventNet.
 * The source code will first be compiled into JS files
 * (ES Moudule) by the TS compiler, which also generates
 * map files. Then, the JS files are packaged into a bundle
 * by Rollup, and the redundant facilities are removed through
 * tree-shaking.
 * A separate process is provided to generate type definition
 * files (*.d.ts).
 * 
 * We can build the library with different facilities by
 * modifing the config files `./src/config.**.ts`, and run
 * `gulp build **` (The ** in both places represents the same
 * identifier).
 * We can also build directly with the config `./src/config.ts`
 * by running `gulp build:direct`.
 */

const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const rollup = require('rollup');
const sourcemaps = require('rollup-plugin-sourcemaps');

////////////////////////// Utility //////////////////////////
function stream2promise(stream) {
   return new Promise((resolve, reject) => {
      stream
         .on('finish', resolve)
         .on('error', reject);
   });
}

function readJson(path) {
   return JSON.parse(fs.readFileSync(path));
}
function writeJson(obj, path) {
   fs.writeFileSync(path, JSON.stringify(obj));
}
//////////////////////////////////////////////////////////////

const date = new Date();
const banner =
   `/**
 * EventNet v${require('./package.json').version}
 * (c) ${'2018-' + date.getFullYear()} X.Y.Z.
 * Released under the MIT License.
 */
`;

async function ts_compile(id = '') {
   const dir_with_id = id === '' ? '' : ('-' + id);
   let tsconfig_path = './tsconfig.json';
   let src = './src';
   if (id !== '') {
      src = `./dist/src-${id}`;
      await stream2promise(
         gulp.src('./src/**/*', { base: './src' })
            .pipe(gulp.dest(src))
      );

      const tsconfig = readJson(tsconfig_path);
      tsconfig.include[0] = `./src${dir_with_id}/**/*.ts`;

      tsconfig_path = `./dist/tsconfig.${id}.json`;
      writeJson(tsconfig, tsconfig_path);

      fs.renameSync(src + '/config.ts', src + '/.config.ts');
      fs.renameSync(`${src}/config.${id}.ts`, `${src}/config.ts`);
   }

   await new Promise((resolve, reject) => {
      const tsc = spawn(
         'tsc',
         ['-p', path.resolve(__dirname, tsconfig_path),
            '--outDir', './dist/esm' + dir_with_id]
      );
      tsc.stdout.on('data', data => {
         console.log(data.toString());
      });
      tsc.stderr.on('data', data => {
         console.log(data.toString());
      });
      tsc.on('exit', code => {
         console.log('tsc exited with code ' + code);
         if (code !== 0) reject();
         else resolve();
      });
   });
}

async function rollup2bundle(id = '') {
   const dir_with_id = id === '' ? '' : ('-' + id);
   const rollup_config = {
      input: {
         input: `dist/esm${dir_with_id}/index.js`,
         external: ['ws', 'tslib'],
         plugins: [sourcemaps()],
      },
      output: {
         name: 'eventnet',
         banner,
         sourcemap: true,
      },
   };

   rollup_config.output.format = 'esm';
   rollup_config.output.file = `dist/esm-bundle${dir_with_id}/index.js`;
   const bundle_esm = await rollup.rollup(rollup_config.input);
   await bundle_esm.write(rollup_config.output);

   rollup_config.output.format = 'cjs';
   rollup_config.output.file = `dist/cjs-bundle${dir_with_id}/index.js`;
   const bundle_cjs = await rollup.rollup(rollup_config.input);
   await bundle_cjs.write(rollup_config.output);
}

gulp.task('build:direct', async () => {
   await ts_compile();
   await rollup2bundle();
});

gulp.task('build', async () => {
   const options = process.argv.slice(2);
   let id = '';
   if (options[1] === '-t' || options[1] === '--target') {
      id = options[2] || '';
   }
   await ts_compile(id);
   await rollup2bundle(id);
})
