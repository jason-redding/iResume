const gulp = require('gulp');
// const exec = require('gulp-exec');
const ts = require('gulp-typescript');
const gSass = require('gulp-sass');
const sass = gSass(require('sass'));
const useref = require('gulp-useref');
const del = require('del');
const browserSync = require('browser-sync').create();
const preprocess = require('gulp-preprocess');
// const sourcemaps = require('gulp-sourcemaps');
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
    NOW: dateToIso8601(NOW)
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

function deployLocal(cb) {
    console.info('Deploy [Local]');
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
    console.info('Concatenate [preprocess, useref]');
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
    let modification = {
        'DEBUG': false,
        'NODE_ENV': 'production'
    };
    modifyContext(modification);
    cb();
}

function modifyContext(modifications) {
    console.info('Modifying Context: ');
    console.info(modifications);
    for (let key in modifications) {
        CONTEXT[key] = modifications[key];
    }
    return CONTEXT;
}

function dateToIso8601(date) {
    let padStart = String.prototype.padStart;
    let year = date.getFullYear();
    let month = padStart.call(date.getMonth() + 1, 2, '0');
    let day = padStart.call(date.getDate(), 2, '0');
    let hours = padStart.call(date.getHours(), 2, '0');
    let minutes = padStart.call(date.getMinutes(), 2, '0');
    let seconds = padStart.call(date.getSeconds(), 2, '0');
    let milliseconds = date.getMilliseconds();
    let timezoneOffset = date.getTimezoneOffset();
    let timezoneOffsetHours = padStart.call(Math.floor(date.getTimezoneOffset() / 60), 2, '0');
    let timezoneOffsetMinutes = padStart.call(date.getTimezoneOffset() % 60, 2, '0');

    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds + (timezoneOffset === 0 ? 'Z' : (timezoneOffset < 0 ? '+' : '-') + (timezoneOffsetHours + timezoneOffsetMinutes))
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

exports.buildProduction = gulp.series(setProduction, showContext, clean, build);
exports.buildProduction.displayName = 'build:production';

exports.dev = gulp.series(showContext, clean, build, browserInit, watchFiles);
exports.dev.description = 'Clean, build, start web-server, and setup watches to reload browser.';

exports.deploy = gulp.series(setProduction, showContext, clean, build, deployLocal);
exports.deploy.description = 'Clean, build, and deploy to local site.';

exports.browser = gulp.series(showContext, browserInit, watchFiles);

exports.sass = compileSass;

exports.copyStatic = copyStatic;

exports.clean = clean;