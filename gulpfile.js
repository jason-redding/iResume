var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var useref = require('gulp-useref');
var gulpSequence = require('gulp-sequence');
var minifyCss = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var del = require('del');

var SRC = 'src';
var DEST = 'public_html';
var DEPLOY_PATH = '/var/www/html.iresume';

gulp.task('default', function(callback) {
	return gulpSequence(
	'clean',
	'build',
	callback);
});

gulp.task('build', function(callback) {
	return gulpSequence(
	'copy-static',
	['sass'],
//	'concat',
	callback);
});

gulp.task('deploy', function(callback) {
	return gulpSequence(
	'clean',
	'build',
	'deploy-live',
	callback);
});

gulp.task('deploy-live', function(callback) {
	return gulp.src([
		DEST + '/**/*'
	], {
		base: DEST
	})
	.pipe(gulp.dest(DEPLOY_PATH));
});

gulp.task('run', function(callback) {
	return gulpSequence(
	'clean',
	'build',
	callback);
});

gulp.task('concat', function(callback) {
	return gulp.src(SRC + '/**/*.html', {
		base: SRC
	})
	.pipe(useref({
		searchPath: DEST
	}))
	.pipe(gulp.dest(DEST));
});

gulp.task('sass', function() {
	return gulp.src(DEST + '/scss/**/*.scss', {
		base: DEST + '/scss'
	})
	.pipe(sourcemaps.init())
	.pipe(sass({
		sourceMap: true,
		outputStyle: 'expanded'
	}).on('error', sass.logError))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest(DEST + '/css'));
});

gulp.task('copy-static', function(callback) {
	return gulp.src([
		SRC + '/**/*'
	], {
		base: SRC
	})
	.pipe(gulp.dest(DEST));
});

gulp.task('clean', function(callback) {
	return del([
		DEST + '/**/*'
	]);
});
