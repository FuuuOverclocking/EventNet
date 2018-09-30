// To view all available commands:
// $> gulp -T

const gulp = require('gulp');
const exec = require('child_process').exec;
const path = require('path');
const del = require('del');
const rename = require('gulp-rename');
const gulp_replace = require('gulp-replace');
const rollup_fn = require('./config/rollup.gulp.js');
const { production_expression_replace_list,
  development_expression_replace_list } = rollup_fn;

const dist_dirs = [
  'cjs', 'esm5', 'esm2015', 'typings',
];

const tsconfig_paths = dist_dirs
  .map(s => path.resolve(__dirname, './config', `tsconfig.${s}.json`));

const clean_tasks = dist_dirs.map(dir =>
  async () => await del([
    'dist/' + dir + '/**',
    'release/' + dir + '/**',
  ])
);

// Due to gulp-typescript's lack of support for tsc's latest features,
// we have to use tsc directly to compile sources.
const ts_tasks = tsconfig_paths.map(tsconfig =>
  cb => exec(
    `tsc -p "${tsconfig}"`,
    (err) => err ? cb(err) : cb(),
  )
);

gulp.task('clean:cjs', clean_tasks[0]);
gulp.task('clean:esm5', clean_tasks[1]);
gulp.task('clean:esm2015', clean_tasks[2]);
gulp.task('clean:typings', clean_tasks[3]);
gulp.task('clean', ['clean:cjs', 'clean:esm5', 'clean:esm2015', 'clean:typings']);

gulp.task('ts:cjs', ['clean:cjs'], ts_tasks[0]);
gulp.task('ts:esm5', ['clean:esm5'], ts_tasks[1]);
gulp.task('ts:esm2015', ['clean:esm2015'], ts_tasks[2]);
gulp.task('ts:typings', ['clean:typings'], ts_tasks[3]);

gulp.task('default', ['ts:cjs']);

const comp_copy_list = [
  'elements/**/*',
  'nodes/**/*',
  'lines/**/*',
  'attrs/**/*',
];

function toPromise(stream) {
  return new Promise((resolve, reject) => {
    stream
      .on('finish', resolve)
      .on('error', reject);
  });
}

function build(type) {
  return async () => {
    await toPromise(gulp.src([
      `dist/${type}/**/*`,
      `!dist/${type}/index.js`,
      `!dist/${type}/index.js.map`,
    ], { base: `./dist/${type}` })
      .pipe(rename(path => {
        if (path.dirname === '.' && path.basename === 'index.dev'/*.js*/)
          path.basename = 'index';
        if (path.dirname === '.' && path.basename === 'index.dev.js'/*.map*/)
          path.basename = 'index.js';
      }))
      .pipe(gulp_replace('//# sourceMappingURL=index.dev.js.map', '//# sourceMappingURL=index.js.map'))
      .pipe(gulp_replace('"file":"index.dev.js"', '"file":"index.js"'))
      .pipe(gulp.dest(`dist/${type}_dev`)));

    await rollup_fn[type]();

    const list = comp_copy_list.map(s => 'dist/' + type + '/' + s);
    const comp_src = gulp.src(list, { base: './dist/' + type });

    comp_src.pipe(gulp.dest('release/' + type + '/dev'));

    let production = comp_src;
    for (str of Object.keys(production_expression_replace_list)) {
      production = production.pipe(gulp_replace(str, production_expression_replace_list[str]));
    }
    production.pipe(gulp.dest('release/' + type + '/'));
  }
}

gulp.task('build:cjs', ['ts:cjs', 'ts:esm5'], build('cjs'));
gulp.task('build:esm5', ['ts:esm5'], build('esm5'));
gulp.task('build:esm2015', ['ts:esm2015'], build('esm2015'));
gulp.task('build:types', ['ts:types'], () => {
  const src = gulp.src('dist/typings/**/*');
  src.pipe(gulp.dest('release/typings'));
  src.pipe(gulp.dest('release/typings/dev'));
});

gulp.task('build', ['build:cjs', 'build:esm5', 'build:esm2015', 'build:types']);

gulp.task('rel:npm', ['build'], () => {
  gulp.src('release/cjs/**/*')
    .pipe(gulp.dest('release/npm_release'));
  gulp.src('release/esm5/**/*')
    .pipe(gulp.dest('release/npm_release/esm5'));
  gulp.src('release/esm2015/**/*')
    .pipe(gulp.dest('release/npm_release/esm2015'));
  gulp.src('release/typings/**/*')
    .pipe(gulp.dest('release/npm_release/typings'));
  gulp.src('package.json')
    .pipe(gulp.dest('release/npm_release'));
});
