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
	THEME: 'a',
	SRC: 'src',
	DEST: 'public_html',
	DEPLOY_PATH: '/var/www/html.iresume',
	DEBUG: true,
	NODE_ENV: 'development',
	NOW: NOW.getFullYear() + '-' + padLeft(NOW.getMonth() + 1, '0', 2) + '-' + padLeft(NOW.getDate(), '0', 2) + 'T' + padLeft(NOW.getHours(), '0', 2) + ':' + padLeft(NOW.getMinutes(), '0', 2) + ':' + padLeft(NOW.getSeconds(), '0', 2) + '.' + NOW.getMilliseconds() + (NOW.getTimezoneOffset() === 0 ? 'Z' : (NOW.getTimezoneOffset() < 0 ? '+' : '-') + (padLeft(Math.floor(NOW.getTimezoneOffset() / 60), '0', 2) + padLeft(NOW.getTimezoneOffset() % 60, '0', 2)))
};

function displayContext(context) {
	console.info('CONTEXT: ');
	console.info(context);
}

gulp.task('default', function(callback) {
	displayContext(CONTEXT);
	return gulpSequence(
	'clean',
	'build',
	callback);
});

gulp.task('browser', function() {
	return browserSync.init({
		open: false,
		ui: false,
		reloadOnRestart: true,
		server: {
			baseDir: CONTEXT.DEST
		}
	});
});

gulp.task('dev', function(callback) {
	displayContext(CONTEXT);
	gulpSequence(
	'clean',
	'build',
	'browser',
	function() {
		gulp.watch(CONTEXT.SRC + '/**/*.html', ['clean-build-refresh']);
		gulp.watch(CONTEXT.SRC + '/**/*.js', ['clean-build-refresh']);
		gulp.watch(CONTEXT.SRC + '/**/*.scss', ['clean-build-refresh']);
		gulp.watch(CONTEXT.SRC + '/**/*.xml', ['clean-build-refresh']);
		gulp.watch(CONTEXT.SRC + '/**/*.xsl', ['clean-build-refresh']);
		gulp.watch(CONTEXT.SRC + '/**/*.xsd', ['clean-build-refresh']);
		callback();
	});
});

gulp.task('clean-build', function(callback) {
	return gulpSequence(
	'clean',
	'build',
	callback);
});

gulp.task('clean-build-refresh', function(callback) {
	displayContext(CONTEXT);
	return gulpSequence(
	'clean',
	'build',
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

gulp.task('browser-reload', function(callback) {
	browserSync.reload();
	callback();
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
		CONTEXT.DEST + '/**/*'
	], {
		base: CONTEXT.DEST
	})
	.pipe(preprocess({
		context: CONTEXT
	}))
	.pipe(gulp.dest(CONTEXT.DEPLOY_PATH));
});

gulp.task('run', function(callback) {
	return gulpSequence(
	'clean',
	'build',
	callback);
});

gulp.task('concat', ['sass'], function() {
	return gulp.src(CONTEXT.SRC + '/**/*.html', {
		base: CONTEXT.SRC
	})
	.pipe(preprocess({
		context: CONTEXT
	}))
	.pipe(useref({
		searchPath: CONTEXT.DEST,
		base: CONTEXT.DEST
	}))
	.pipe(gulp.dest(CONTEXT.DEST));
});

gulp.task('sass', function() {
	return gulp.src(CONTEXT.DEST + '/scss/**/*.scss', {
		base: CONTEXT.DEST + '/scss'
	})
	.pipe(sass({
		sourceMap: false,
		outputStyle: 'expanded'
	}).on('error', sass.logError))
	.pipe(gulp.dest(CONTEXT.DEST + '/css'));
});

gulp.task('copy-static', function() {
	return gulp.src([
		CONTEXT.SRC + '/**/*'
	], {
		base: CONTEXT.SRC
	})
	//.pipe(preprocess())
	.pipe(gulp.dest(CONTEXT.DEST));
});

gulp.task('clean', function() {
	return del([
		CONTEXT.DEST + '/**/*'
	]);
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