const { dest, parallel, series, src } = require('gulp');

module.exports = {
   default: series(clean, build),
   usage,
   build,
   clean,
};

async function usage() {
   console.log(`
Usage:
   · 'gulp build [-t] [-e <ext>]'  - Build EventNet from sources.
      · -e <ext>  - The entry will be 'src/entry.ts' or
                    'src/entry.<ext>.ts' if <ext> is specified.
      · -t        - Build the declaration files only.
   · 'gulp clean [-t] [-e <ext>]'  - Clean the build directory.

The build process of EventNet:
  1. The source code will first be compiled into JavaScript (ESM)
     with SourceMap by TypeScript compiler.
  2. The JS files are packaged into a bundle by Rollup,
     and unused functions are removed through tree-shaking.
`
   );
}

async function build() {
   const options = process.argv.slice(2);
   const ext = options[1] || '';
}

async function clean() {

}

async function build_type() {

}
