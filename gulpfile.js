const gulp = require('gulp')
const ts = require('gulp-typescript')
const merge = require('merge2');
const tsProject = ts.createProject('tsconfig.json')

gulp.task('default', function () {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('dist'));
});

gulp.task('scripts', function() {
  const tsResult = tsProject.src().pipe(tsProject());
  return merge([
    tsResult.dts.pipe(gulp.dest('dist/definitions')),
    tsResult.js.pipe(gulp.dest('dist'))
  ]);
});

gulp.task('watch', ['scripts'], function() {
  gulp.watch('src/**/*.ts', ['scripts']);
});
