const gulp = require('gulp');

gulp.task('usage', cb => {
   console.log(`
Usage:
  · 'gulp build'       - Build EventNet from sources.
  · 'gulp build {ext}' - Use \`src/config.{ext}.ts\`
                       instead of \`src/config.ts\`
                       as the configuration file to
                       build EventNet.
  · 'gulp clean'       - Clean the build directory.
  · 'gulp clean {ext}' - (ext) Clean the build directory.
  · 'gulp build:type'  - Build the TypeScript declaration files.

The build process of EventNet:
  1. The source code will first be compiled into JS files
     (ES Moudule)  with SourceMap by the TS compiler.
  2. The JS files are packaged into a bundle by Rollup,
     and unused functions are removed through tree-shaking.
`
   );
   cb();
});

const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const rollup = require('rollup');
const sourcemaps = require('rollup-plugin-sourcemaps');

gulp.task('build', ['clean'], async () => {
   const options = process.argv.slice(2);
   const ext = options[1] || '';
   // await ts_compile(ext);
   // await rollup2bundle(ext);
});

gulp.task('clean', async () => {
   console.log(process.argv.slice(2));
});


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

const date = new Date();
const banner =
   `/**
 * EventNet v${require('./package.json.js').version}
 * (c) ${'2018-' + date.getFullYear()} X.Y.Z.
 * Released under the MIT License.
 */
`;

async function ts_compile(ext) {
   const dir_with_ext = ext === '' ? '' : ('-' + ext);
   let tsconfig_path = './tsconfig.json';
   let src = './src';
   if (ext !== '') {
      src = `./dist/src-${ext}`;
      await stream2promise(
         gulp.src('./src/**/*', { base: './src' })
            .pipe(gulp.dest(src))
      );

      const tsconfig = readJson(tsconfig_path);
      tsconfig.include[0] = `./src${dir_with_ext}/**/*.ts`;

      tsconfig_path = `./dist/tsconfig.${ext}.json`;
      writeJson(tsconfig, tsconfig_path);

      fs.renameSync(src + '/config.ts', src + '/.config.ts');
      fs.renameSync(`${src}/config.${ext}.ts`, `${src}/config.ts`);
   }

   await new Promise((resolve, reject) => {
      const tsc = spawn(
         'tsc',
         ['-p', path.resolve(__dirname, tsconfig_path),
            '--outDir', './dist/esm' + dir_with_ext]
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

async function rollup2bundle(ext) {
   const dir_with_ext = ext === '' ? '' : ('-' + ext);
   const rollup_config = {
      input: {
         input: `dist/esm${dir_with_ext}/index.js`,
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
   rollup_config.output.file = `dist/esm-bundle${dir_with_ext}/index.js`;
   const bundle_esm = await rollup.rollup(rollup_config.input);
   await bundle_esm.write(rollup_config.output);

   rollup_config.output.format = 'cjs';
   rollup_config.output.file = `dist/cjs-bundle${dir_with_ext}/index.js`;
   const bundle_cjs = await rollup.rollup(rollup_config.input);
   await bundle_cjs.write(rollup_config.output);
}
