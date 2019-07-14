const path = require('path');
const spawn = require('child_process').spawn;

exports.getPath = p => path.resolve(__dirname, '../', p);

exports.nodeCmd = args => {
   return new Promise((OK, KO) => {
      const proc = spawn('node', args);
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stdout);
      proc.on('exit', code => {
         if (code !== 0) KO(code);
         else OK();
      });
   });
};

exports.banner = (() => {
   const date = new Date();
   const banner = `
/**
 * EventNet v${require('../package.json').version}
 * (c) ${'2018-' + date.getFullYear()} X.Y.Z.
 * Released under the MIT License.
 */
`;
   return banner;
})();
