var gulp = require('gulp');
var sass = require('gulp-sass');
var useref = require('gulp-useref');
var gulpSequence = require('gulp-sequence');
var uglify = require('gulp-uglify');
var del = require('del');
var browserSync = require('browser-sync').create();
var preprocess = require('gulp-preprocess');

var NOW = new Date();
var CONTEXT = {
	NOW: NOW.getFullYear() + '-' + padLeft(NOW.getMonth() + 1, '0', 2) + '-' + padLeft(NOW.getDate(), '0', 2) + 'T' + padLeft(NOW.getHours(), '0', 2) + ':' + padLeft(NOW.getMinutes(), '0', 2) + ':' + padLeft(NOW.getSeconds(), '0', 2) + '.' + NOW.getMilliseconds() + (NOW.getTimezoneOffset() === 0 ? 'Z' : (NOW.getTimezoneOffset() < 0 ? '+' : '-') + (padLeft(Math.floor(NOW.getTimezoneOffset() / 60), '0', 2) + padLeft(NOW.getTimezoneOffset() % 60, '0', 2))),
	DEBUG: true,
	NODE_ENV: 'development'
};

var SRC = 'src';
var DEST = 'public_html';
var DEPLOY_PATH = '/var/www/html.iresume';

function displayContext(context) {
	console.dir(context);
}

gulp.task('default', function(callback) {
	displayContext(CONTEXT);
	return gulpSequence(
	'clean-build',
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
	gulp.watch(SRC + '/**/*.html', ['clean-build-refresh']);
	gulp.watch(SRC + '/**/*.js', ['clean-build-refresh']);
	gulp.watch(SRC + '/**/*.scss', ['clean-build-refresh']);
	gulp.watch(SRC + '/**/*.xml', ['clean-build-refresh']);
	gulp.watch(SRC + '/**/*.xsl', ['clean-build-refresh']);
	return gulp.watch(SRC + '/**/*.xsd', ['clean-build-refresh']);
});

gulp.task('clean-build', function(callback) {
	return gulpSequence(
	'clean',
	'build',
	callback);
});

gulp.task('clean-build-refresh', function(callback) {
	console.log(CONTEXT.NOW);
	return gulpSequence(
	'clean-build',
	'browser-reload',
	callback);
});

gulp.task('build', function(callback) {
	return gulpSequence(
	'copy-static',
	//['sass'],
	'concat',
	callback);
});

gulp.task('browser-reload', function() {
	browserSync.reload();
});

gulp.task('deploy', function(callback) {
	CONTEXT['DEBUG'] = false;
	CONTEXT['NODE_ENV'] = 'production';
	displayContext(CONTEXT);
	return gulpSequence(
	'clean',
	'build',
	'deploy-live',
	callback);
});

gulp.task('deploy-live', function() {
	return gulp.src([
		DEST + '/**/*'
	], {
		base: DEST
	})
	.pipe(preprocess({
		context: CONTEXT
	}))
	.pipe(gulp.dest(DEPLOY_PATH));
});

gulp.task('run', function(callback) {
	return gulpSequence(
	'clean',
	'build',
	callback);
});

gulp.task('concat', ['sass'], function() {
	return gulp.src(SRC + '/**/*.html', {
		base: SRC
	})
	.pipe(preprocess({
		context: CONTEXT
	}))
	.pipe(useref({
		searchPath: DEST,
		base: DEST
	}))
	.pipe(gulp.dest(DEST));
});

gulp.task('sass', function() {
	return gulp.src(DEST + '/scss/**/*.scss', {
		base: DEST + '/scss'
	})
	.pipe(sass({
		sourceMap: false,
		outputStyle: 'expanded'
	}).on('error', sass.logError))
	.pipe(gulp.dest(DEST + '/css'));
});

gulp.task('copy-static', function() {
	return gulp.src([
		SRC + '/**/*'
	], {
		base: SRC
	})
	//.pipe(preprocess())
	.pipe(gulp.dest(DEST));
});

gulp.task('clean', function(callback) {
	return del([
		DEST + '/**/*'
	], callback);
});

function padLeft(input, char, size) {
	if (('' + char).length === 0) {
		char = ' ';
	}
	input = ('' + input);
	var i = input.length;
	while (i < size) {
		input = char + input;
		i += char.length;
	}
	return input;
}