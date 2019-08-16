const gulp = require('gulp');
const exec = require('gulp-exec');
const sass = require('gulp-sass');
const ts = require('gulp-typescript');
sass.compiler = require('node-sass');
const useref = require('gulp-useref');
const del = require('del');
const browserSync = require('browser-sync').create();
const preprocess = require('gulp-preprocess');
const sourcemaps = require('gulp-sourcemaps');
const fs = require('fs');
const os = require('os');

const tsConfig = ts.createProject('tsconfig.json');

const NOW = new Date();
const CONTEXT = {
    THEME: 'a',
    SRC: 'src',
    DEST: 'public_html',
    DEPLOY_PATH: os.homedir() + '/www',
    DEBUG: true,
    NODE_ENV: 'development',
    HOMEDIR: os.homedir(),
    HOSTNAME: os.hostname(),
    NOW: NOW.getFullYear() + '-' + padLeft(NOW.getMonth() + 1, '0', 2) + '-' + padLeft(NOW.getDate(), '0', 2) + 'T' + padLeft(NOW.getHours(), '0', 2) + ':' + padLeft(NOW.getMinutes(), '0', 2) + ':' + padLeft(NOW.getSeconds(), '0', 2) + '.' + NOW.getMilliseconds() + (NOW.getTimezoneOffset() === 0 ? 'Z' : (NOW.getTimezoneOffset() < 0 ? '+' : '-') + (padLeft(Math.floor(NOW.getTimezoneOffset() / 60), '0', 2) + padLeft(NOW.getTimezoneOffset() % 60, '0', 2)))
};

function showContext(cb) {
    console.info('CONTEXT: ');
    console.info(CONTEXT);
    cb();
}

function browserInit(cb) {
    browserSync.init({
        open: false,
        ui: false,
        reloadOnRestart: true,
        server: {
            baseDir: CONTEXT.DEST
        }
    });
    cb();
}

function browserReload(cb) {
    browserSync.reload();
    cb();
}

function deployLive(cb) {
    var isLocal = (('HOSTNAME' in CONTEXT) && CONTEXT['HOSTNAME'] === 'purple.atonal.org');
    if (isLocal) {
        return gulp.src(CONTEXT.DEST + '/**/*', {
            base: CONTEXT.DEST
        })
        //.pipe(preprocess({
        //	context: CONTEXT
        //}))
        .pipe(gulp.dest(CONTEXT.DEPLOY_PATH, {}));
    } else {
        exec('echo -e "git pull && npx gulp deploy" | ssh jman');
        cb();
    }
}

function concat() {
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
    .pipe(gulp.dest(CONTEXT.DEST, {}));
}

function compileSass() {
    return gulp.src(CONTEXT.DEST + '/scss/**/*.scss', {
        base: CONTEXT.DEST + '/scss'
    })
    .pipe(sass({
        sourceMap: false,
        outputStyle: 'expanded',
        omitSourceMapUrl: true
    }).on('error', sass.logError))
    .pipe(gulp.dest(CONTEXT.DEST + '/css', {}));
}

function compileTypeScript(cb) {
    return gulp.src(CONTEXT.DEST + '/**/*.ts', {
        base: CONTEXT.DEST
    })
    // .pipe(sourcemaps.init())
    .pipe(tsConfig())
    // .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(CONTEXT.DEST, {}));
}

function compile(cb) {
    return new Promise(gulp.parallel(compileTypeScript, compileSass)).then(cb);
}

function copyStatic() {
    return gulp.src(CONTEXT.SRC + '/**/*', {
        base: CONTEXT.SRC
    })
    .pipe(gulp.dest(CONTEXT.DEST, {}));
}

function build(cb) {
    return new Promise(gulp.series(copyStatic, compile, concat)).then(cb);
}

function clean() {
    return del([
        CONTEXT.DEST + '/**/*'
    ]);
}

function watchFiles(cb) {
    const watchResponse = gulp.series(clean, build, browserReload);
    gulp.watch(CONTEXT.SRC + '/**/*.html', watchResponse);
    gulp.watch(CONTEXT.SRC + '/**/*.ts', watchResponse);
    gulp.watch(CONTEXT.SRC + '/index.js', watchResponse);
    gulp.watch(CONTEXT.SRC + '/js/**/*.js', watchResponse);
    gulp.watch(CONTEXT.SRC + '/**/*.scss', watchResponse);
    gulp.watch(CONTEXT.SRC + '/**/*.xml', watchResponse);
    gulp.watch(CONTEXT.SRC + '/**/*.xsl', watchResponse);
    gulp.watch(CONTEXT.SRC + '/**/*.xsd', watchResponse);
    gulp.watch(CONTEXT.SRC + '/gulpfile.js', watchResponse);
    cb();
}

function setProduction(cb) {
    CONTEXT['DEBUG'] = false;
    CONTEXT['NODE_ENV'] = 'production';
    cb();
}

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


exports.cleanBuild = gulp.series(showContext, clean, build);
exports.cleanBuild.displayName = 'clean-build';
exports.cleanBuild.description = 'Clean, and build to project folder.';

exports.default = exports.cleanBuild;

exports.build = build;

exports.buildProduction = gulp.series(setProduction, showContext, build);
exports.buildProduction.displayName = 'build:production';

exports.dev = gulp.series(showContext, clean, build, browserInit, watchFiles);
exports.dev.description = 'Clean, build, start web-server, and setup watches to reload browser.';

exports.deploy = gulp.series(setProduction, showContext, clean, build, deployLive);
exports.deploy.description = 'Clean, build, and deploy to live site.';

exports.browser = gulp.series(showContext, browserInit, watchFiles);

exports.sass = compileSass;

exports.copyStatic = copyStatic;

exports.clean = clean;