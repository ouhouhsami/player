var browserify = require('browserify');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var connect = require('gulp-connect');
var source = require('vinyl-source-stream');

var packageJson = require('./package.json');
var name = packageJson.exports || packageJson.name;
var exports =  packageJson.exports;
var dependencies = Object.keys(packageJson && packageJson.dependencies || {});

gulp.task('dependencies', function () {
  return browserify()
    .require(dependencies)
    .bundle()
    .pipe(source('dependencies.js'))
    .pipe(gulp.dest('./tests/'));
});

gulp.task('lib', function () {
  return browserify('./index.js')
    .external(dependencies)
    .bundle({
        standalone : name
    })
    .pipe(source(packageJson.name + '.js'))
    .pipe(gulp.dest('./tests/'));
});

gulp.task('standalone', function () {
  return browserify('./index.js')
    .bundle({
        standalone : name
    })
    .pipe(source(packageJson.name + '.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('uglify', function() {
  return browserify('./index.js')
    .bundle()
    .pipe(source(packageJson.name + '.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('./'));
});

gulp.task('connectDev', function () {
  connect.server({
    root: ['./'],
    port: 9001,
    livereload: false
  });
});

gulp.task('watch', function() {
  gulp.watch("./", ['dependencies', 'lib', 'standalone', 'uglify']);
});

gulp.task('default', ['dependencies', 'lib', 'standalone', 'uglify', 'connectDev', 'watch']);
