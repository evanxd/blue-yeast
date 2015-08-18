/* jshint node: true */
'use strict';
var gulp = require('gulp');
var del = require('del');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var stylish = require('gulp-jscs-stylish');
var jsonlint = require('gulp-jsonlint');
var sloc = require('gulp-sloc');
var noop = function() {};

var options = {
  param: { // Project settings
    debug: false,
    build: 'build',
    dist: 'dist'
  }
};

var lintSources = [
  '**/*.js',
  '!' + options.param.build + '/**',
  '!' + options.param.dist + '/**',
  '!node_modules/**'
];

gulp.task('jsonlint', function() {
  return gulp.src([
    '**/*.json',
    '!' + options.param.build + '/**',
    '!' + options.param.dist + '/**',
    '!node_modules/**'])
    .pipe(jsonlint())
    .pipe(jsonlint.reporter());
});

gulp.task('sloc', function() {
  return gulp.src(lintSources)
    .pipe(sloc());
});

gulp.task('clean', function(cb) {
  return del([
    options.param.build,
    options.param.dist
  ], cb);
});

gulp.task('lint', ['jsonlint', 'sloc'],
  function() {
    return gulp.src(lintSources)
      .pipe(jshint('.jshintrc'))
      .pipe(jscs('.jscsrc'))
      .on('error', noop) // don't stop on error
      .pipe(stylish.combineWithHintResults())
      .pipe(jshint.reporter('default'));
  });

gulp.task('githooks', function() {
  return gulp.src(['pre-commit'])
    .pipe(gulp.dest('.git/hooks'));
});

