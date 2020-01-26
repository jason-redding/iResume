const gulp = require('gulp');
const exec = require('gulp-exec');
const ts = require('gulp-typescript');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const useref = require('gulp-useref');
const del = require('del');
const browserSync = require('browser-sync').create();
const preprocess = require('gulp-preprocess');
const sourcemaps = require('gulp-sourcemaps');
const os = require('os');

const tsProject = ts.createProject('tsconfig.json');

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

function watchFiles(cb) {
    const watchResponse = gulp.series(clean, build, browserReload);
    const files = [
        CONTEXT.SRC + '/**/*.html',
        CONTEXT.SRC + '/**/*.ts',
        CONTEXT.SRC + '/index.js',
        CONTEXT.SRC + '/js/**/*.js',
        CONTEXT.SRC + '/**/*.scss',
        CONTEXT.SRC + '/**/*.xml',
        CONTEXT.SRC + '/**/*.xsl',
        CONTEXT.SRC + '/**/*.xsd',
        'tsconfig.json'
    ];
    gulp.watch(files, watchResponse);
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
    return gulp.src(CONTEXT.DEST + '/**/*', {
        base: CONTEXT.DEST
    })
    .pipe(gulp.dest(CONTEXT.DEPLOY_PATH, {}));
}

function preBuild(cb) {
    cb();
}

function postBuild(cb) {
    cb();
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
    let tsResult =
    gulp.src(CONTEXT.DEST + '/**/*.ts', {base: CONTEXT.DEST})
    // .pipe(sourcemaps.init())
    // .pipe(tsProject())
    .pipe(tsProject())
    ;
    return tsResult
    // .pipe(sourcemaps.write('.'))
    .js
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
    return new Promise(gulp.series(preBuild, copyStatic, compile, concat, postBuild)).then(cb);
}

function clean() {
    return del([
        CONTEXT.DEST + '/**/*'
    ]);
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

function cleanBuild() {
    return gulp.series(showContext, clean, build);
}

exports.cleanBuild = cleanBuild();
exports.cleanBuild.displayName = 'clean-build';
exports.cleanBuild.description = 'Clean, and build to project folder.';

exports.default = cleanBuild();
exports.default.description = 'Alias for clean-build.';

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