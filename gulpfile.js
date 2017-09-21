var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var useref = require('gulp-useref');
var gulpSequence = require('gulp-sequence');
var minifyCss = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var del = require('del');
var browserSync = require('browser-sync').create();

var SRC = 'src';
var DEST = 'public_html';
var DEPLOY_PATH = '/var/www/html.iresume';

gulp.task('default', function(callback) {
	return gulpSequence(
	'clean',
	'build',
	'watch',
	callback);
});

gulp.task('browserSync', function() {
	return browserSync.init({
		open: false,
		server: {
			baseDir: DEST
		}
	});
});

gulp.task('watch', ['browserSync'], function() {
	gulp.watch(SRC + '/**/*.html', ['clean-build']);
	gulp.watch(SRC + '/**/*.js', ['clean-build']);
	gulp.watch(SRC + '/**/*.scss', ['clean-build']);
	gulp.watch(SRC + '/**/*.xml', ['clean-build']);
	gulp.watch(SRC + '/**/*.xsl', ['clean-build']);
	return gulp.watch(SRC + '/**/*.xsd', ['clean-build']);
});

gulp.task('clean-build', function(callback) {
	return gulpSequence(
	'clean',
	'build',
	'browser-reload',
	callback);
});

gulp.task('build', function(callback) {
	return gulpSequence(
	'copy-static',
	['sass'],
//	'concat',
	callback);
});

gulp.task('browser-reload', function(callback) {
	browserSync.reload();
	callback();
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

gulp.task('copy-static', function() {
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
	], callback);
});
