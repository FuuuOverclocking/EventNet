#!/usr/bin/env node
const usage = `
Build EventNet from sources.
By default, the entry will be 'src/entry.ts' and all versions are to be built.

Options:

   -e, --entry <ext>,<ext>...       Specify the entry as 'src/entry.<ext>.ts', ...
   -a, --all-entries                Build for each entry file in the 'src' directory.
   -v, --version <v>,<v>...         Specify the version to be built. <v> can be:
                                       cjs, esm, esm-browser, umd, types
   -h, --help                       Show this help message.
`;

const { red, yellow, green, blue } = require('chalk');
const fs = require('fs-extra');
const terser = require('terser');
const { nodeCmd, banner } = require('./util');
const zlib = require('zlib');

// avoid warnings
require('events').EventEmitter.defaultMaxListeners = 100;

main().catch(e => console.log(e));

async function main() {
   // extract command line parameters using `yargs`
   const argv = require('yargs')
      .help(false).version(false)
      .option('entry', { alias: 'e' })
      .option('all-entries', { alias: 'a' })
      .option('version', { alias: 'v' })
      .option('help', { alias: 'h' })
      .conflicts('all-entries', 'entry')
      .fail(msg => {
         console.warn(red(msg));
         console.log(usage);
      })
      .strict()
      .argv;

   const { entries, versions } = resolveArgv(argv);
   if (!entries.length) {
      return;
   }

   if (!fs.existsSync('build')) {
      fs.mkdirSync('build');
   }

   const versionDependencyTree = resolveVersions(versions);

   await build({ entries, versions, tree: versionDependencyTree });


   /**
    * Resolving argv and checking correctness.
    */
   function resolveArgv(argv) {
      let entries = ['default'];
      let versions = 'cjs esm esm-browser umd types'.split(' ');

      if (typeof argv.entry === 'string') {
         entries = argv.entry.split(',').map(str => str.trim());
         for (const entry of entries) {
            let filenameToCheck = 'src/entry' +
               (entry === 'default' ? '.ts' : '.' + entry + '.ts');

            if (!fs.existsSync(filenameToCheck)) {
               throw chalk.red('Entry `' + filenameToCheck + '` not exists.');
            }
         }
      } else if (argv.allEntries) {
         entries = fs.readdirSync('src')
            .filter(filename =>
               filename.startsWith('entry') && filename.endsWith('.ts')
            ).map(filename =>
               filename === 'entry.ts' ? 'default' :
                  filename.slice(6, -3)
            );
      }

      if (typeof argv.version === 'string') {
         versions = argv.version.split(',').map(str => str.trim());
         const validVersions = 'cjs esm esm-browser umd types'.split(' ');
         for (const ver of versions) {
            if (~validVersions.indexOf(ver)) continue;
            throw chalk.red(`Invalid version: ${ver}`);
         }
      }

      if (argv.help) {
         entries = [];
         version = [];
         console.log(usage);
      }
      return { entries, versions };
   }

   /**
    * Generate a dependency tree from the version array.
    * (the building of `esm-browser` and `umd` depends on `esm`)
    *
    * e.g. ['cjs', 'esm', 'esm-browser', 'umd', 'types'] ->
    * {
    *    cjs: true,
    *    types: true,
    *    esm: {
    *       'esm-browser': true,
    *       umd: true,
    *    },
    * }
    */
   function resolveVersions(versions) {
      const tree = {};
      ['cjs', 'esm', 'types'].forEach(ver => {
         if (~versions.indexOf(ver)) tree[ver] = true;
      });
      ['esm-browser', 'umd'].forEach(ver => {
         if (~versions.indexOf(ver)) {
            if (typeof tree.esm === 'undefined' || tree.esm === true) {
               tree.esm = {};
            }
            tree.esm[ver] = true;
         }
      });
      return tree;
   }
}

async function build({ entries, versions, tree }) {
   const startTime = process.hrtime();
   console.log(yellow('Start building...'));
   console.log(yellow(`Entries: ${entries.join(',')}`));
   console.log(yellow(`Versions: ${versions.join(',')}`));
   console.log();

   await Promise.all(
      entries.map(
         entry => buildSingle({ entry, tree })
      )
   );

   let takeTime = process.hrtime(startTime);
   takeTime = takeTime[0] + '.' + parseInt(takeTime[1] / 1e6);
   console.log(yellow('The building was completed in ' + takeTime + 's.'));
}

/**
 * Build for the specified entry.
 */
async function buildSingle({ entry, tree }) {
   fs.removeSync(`build/${entry}/src`);
   fs.copySync('src', `build/${entry}/src`);
   fs.renameSync(
      `build/${entry}/src/entry${
      entry === 'default' ? '' : '.' + entry
      }.ts`,
      `build/${entry}/src/entry.ts`
   );
   fs.readdirSync(`build/${entry}/src`)
      .filter(
         filename =>
            filename !== 'entry.ts' &&
            filename.startsWith('entry') &&
            filename.endsWith('.ts')
      ).forEach(filename => fs.removeSync(`build/${entry}/src/${filename}`))

   const allFuncJS = fs.readFileSync(`build/${entry}/src/all-func.ts`, 'utf8');
   const newAllFuncJSArr = [];
   let enableNextLine = false;
   for (let line of allFuncJS.split('\n')) {
      if (enableNextLine) {
         line = line.replace('// ', '');
         enableNextLine = false;
      }
      if (line.startsWith('/////')) {
         const targetEntries =
            line
               .split('=')[1]
               .replace(/\s/g, '')
               .split(',');
         if (~targetEntries.indexOf(entry)) {
            enableNextLine = true;
         }
      }
      newAllFuncJSArr.push(line);
   }
   fs.writeFileSync(
      `build/${entry}/src/all-func.ts`,
      newAllFuncJSArr.join('\n')
   );

   await walk(tree);

   function walk(node) {
      const promiseArray = [];
      Object.keys(node).forEach(key => {
         if (node[key] === true) {
            promiseArray.push(buildSingleVersion({ entry, version: key }));
         } else {
            promiseArray.push(
               buildSingleVersion({ entry, version: key }).then(
                  () => walk(node[key])
               )
            );
         }
      });
      return Promise.all(promiseArray);
   }
}

/**
 * Build for the specified entry and version.
 */
async function buildSingleVersion({ entry, version }) {
   fs.removeSync(`build/${entry}/${version}`);

   if (~['cjs', 'esm', 'types'].indexOf(version)) {
      fs.copyFileSync(
         `scripts/tsconfigs/tsconfig.${version}.json`,
         `build/${entry}/tsconfig.${version}.json`
      );
      console.log(yellow(
         `${entry}(${version}):\tCompiling TypeScript...`
      ));

      try {
         await nodeCmd([
            './node_modules/typescript/bin/tsc',
            '-p', `build/${entry}/tsconfig.${version}.json`
         ]);
         console.log(green(
            `${entry}(${version}):\tTypeScript compilation OK.`
         ));
      } catch (code) {
         throw new Error(red(
            `${entry}(${version}):\tError: tsc exited with code ${code}`
         ));
      }
   } else if (~['esm-browser', 'umd'].indexOf(version)) {
      console.log(yellow(
         `${entry}(${version}):\tPacking with Rollup...`
      ));

      try {
         await nodeCmd([
            './node_modules/rollup/bin/rollup',
            '-c', './scripts/rollup.config.js',
            '--environment', 'TARGET:' + entry + '/' + version
         ]);
         console.log(green(
            `${entry}(${version}):\tRollup OK.`
         ));
      } catch (code) {
         throw new Error(red(
            `${entry}(${version}):\tError: rollup exited with code ${code}`
         ));
      }

      try {
         const code = fs.readFileSync(`build/${entry}/${version}/eventnet.js`, 'utf8');
         console.log(yellow(
            `${entry}(${version}):\tMinifying with Terser...`
         ));
         const minified = terser.minify(code, {
            ecma: 6,
            toplevel: true,
            sourceMap: {
               filename: 'eventnet.min.js',
               url: 'eventnet.min.js.map',
               content: fs.readFileSync(`build/${entry}/${version}/eventnet.js.map`, 'utf8'),
            }
         });
         const minifiedCode = banner + minified.code;
         fs.writeFileSync(`build/${entry}/${version}/eventnet.min.js`, minifiedCode);
         fs.writeFileSync(`build/${entry}/${version}/eventnet.min.js.map`, minified.map);

         const gzippedCode = zlib.gzipSync(minifiedCode);

         function sizeof(str) {
            return (str.length / 1024).toFixed(2) + 'KB';
         }

         console.log(
            blue(sizeof(code)) + yellow(`\t\t\t\tbuild/${entry}/${version}/eventnet.js`)
         );
         console.log(
            blue(`${sizeof(minifiedCode)} (gzipped: ${sizeof(gzippedCode)}) `) +
            yellow(`\tbuild/${entry}/${version}/eventnet.min.js`)
         );
      } catch (e) {
         throw new Error(red(`${entry}(${version}):\t Terser/zlib error: ${e}`));
      }
   }
}
