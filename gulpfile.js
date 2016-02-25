var fs = require('fs'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    plumber = require('gulp-plumber'),
    del = require('del'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    stylus = require('gulp-stylus'),
    replace = require('gulp-replace'),
    preprocess = require('gulp-preprocess'),
    autoprefixer = require('gulp-autoprefixer'),
    csso = require('gulp-csso'),
    changed = require('gulp-changed'),
    sourcemaps = require('gulp-sourcemaps');
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    browserify = require('browserify'),
    browserSync = require('browser-sync'),
    reload = function() { browserSync.reload() },
    through = require('through'),
    ghpages = require('gh-pages'),
    path = require('path'),
    merge = require('merge-stream'),
    isDist = process.argv.indexOf('serve') === -1;

gulp.task('js', function() {
  return browserify({
      entries: 'scripts/main.js',
      debug: true
    })
    .bundle()
    .on('error', function(err) {
      gutil.log(gutil.colors.red('Browserify bundle error: ') + err);
      // gutil.beep('**--*');
      browserSync.notify("Browserify Error!");
      this.emit('end');
    })
    .pipe(source('build.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(isDist ? uglify() : through())
      .on('error', function(err) {
        gutil.log(gutil.colors.red('Uglify error: ') + err.message);
        // gutil.beep('**--*');
        browserSync.notify("Uglify Error!");
        this.emit('end');
    })
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/build'))
    // .on('end', gutil.beep.bind(null, '*'))
    .pipe(browserSync.stream({ once: true }));
});

gulp.task('js-watch', ['js'], reload);

// gulp.task('js-classes', function() {
  // var destination = 'dist/scripts/classes';
  // return gulp.src(['scripts/classes/**/*.js'])
  //   .pipe(changed(destination))
  //   .pipe(isDist ? through() : plumber())
  //   .pipe(browserify({ debug: !isDist }))
  //   .pipe(isDist ? uglify() : through())
  //   .pipe(uglify())
  //   .pipe(gulp.dest(destination));
// });



gulp.task('html', function() {
  return gulp.src('html/index.html')
    .pipe(preprocess({context: { NODE_ENV: isDist ? 'production' : 'development', DEBUG: true}}))
    .pipe(isDist ? through() : plumber())
    .pipe(replace('{path-to-root}', '.'))
    .pipe(gulp.dest('dist'))
    .on('end', reload);
});

gulp.task('md', function() {
  var tasks = [];
  tasks.push(gulp.src('README.md')
    .pipe(changed('dist'))
    .pipe(isDist ? through() : plumber())
    .pipe(gulp.dest('dist'))
    .on('end', reload));
  tasks.push(gulp.src('classes/**/*.md')
    .pipe(changed('dist/classes'))
    .pipe(isDist ? through() : plumber())
    .pipe(gulp.dest('dist/classes'))
    .on('end', reload));
  tasks.push(gulp.src('assignments/**/*.md')
    .pipe(changed('dist/assignments'))
    .pipe(isDist ? through() : plumber())
    .pipe(gulp.dest('dist/assignments'))
    .on('end', reload));
  return merge(tasks);
});

gulp.task('css', function() {
  return gulp.src('styles/main.styl')
    .pipe(changed('dist/build'))
    .pipe(isDist ? through() : plumber())
    .pipe(stylus({
      // Allow CSS to be imported from node_modules and bower_components
      'include css': true,
      'paths': ['./node_modules']
    }))
    .pipe(autoprefixer('last 2 versions', { map: false }))
    .pipe(isDist ? csso() : through())
    .pipe(rename('build.css'))
    .pipe(gulp.dest('dist/build'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('attachments', function() {
  var destination = 'dist/attachments';
  return gulp.src('attachments/**/*')
    .pipe(changed(destination))
    .pipe(gulp.dest(destination));
});

gulp.task('images', function() {
  var destination = 'dist/images';
  return gulp.src(['images/**/*', '!images/**/*.db'])
    .pipe(changed(destination))
    .pipe(gulp.dest(destination))
    .on('end', reload);
});

gulp.task('fonts', function() {
  var destination = 'dist/fonts';
  return gulp.src('fonts/**/*')
    .pipe(changed(destination))
    .pipe(gulp.dest(destination))
    .on('end', reload);
});

gulp.task('videos', function() {
  var destination = 'dist/videos';
  return gulp.src('videos/**/*')
    .pipe(changed(destination))
    .pipe(gulp.dest(destination))
    .on('end', reload);
});

gulp.task('favicon', function() {
  var destination = 'dist/favicon';
  return gulp.src('favicon/**/*')
    .pipe(changed(destination))
    .pipe(gulp.dest(destination))
    .on('end', reload);
});

gulp.task('clean', function() {
  return del('dist');
});


function getFolders(cwd, dir) {
  var targetDirectory = path.join(cwd, dir);
  return fs.readdirSync(targetDirectory)
    .filter(function(file) {
      return fs.statSync(path.join(targetDirectory, file)).isDirectory();
    })
    .map(function(filePath) {
      return path.join(dir, filePath);
    });
}

gulp.task('build', ['js', /*'js-classes',*/ 'html', 'md', 'css', 'images', 'fonts', 'videos', 'attachments', 'favicon'], function() {
  var folders = getFolders('.', 'classes').concat(getFolders('.', 'assignments')),
      tasks = folders.map(function(folder) {
        var t = [];
        t.push(gulp.src(['html/index.html'])
          .pipe(replace('{path-to-root}', '../../.'))
          .pipe(gulp.dest(path.join('dist', folder))));
        return merge(t);
      });
  return merge(tasks);
});

gulp.task('deploy', [], function(done) {
  ghpages.publish(path.join(__dirname, 'dist'), { logger: gutil.log }, done);
});

gulp.task('serve', ['build'], function() {
  browserSync.init({
    server: 'dist',
    port: 8080
  });

  gulp.watch('scripts/*.js', ['js-watch']);
  // gulp.watch('scripts/classes/*.js', ['js-classes']);
  gulp.watch('html/**/*.html', ['html']);
  gulp.watch('classes/**/*.md');
  gulp.watch('assignments/**/*.md', ['md']);
  gulp.watch('README.md', ['md']);
  gulp.watch('styles/**/*.styl', ['css']);
  gulp.watch('styles/classes/*.css', ['css-classes']);
  gulp.watch('images/**/*', ['images']);
});

gulp.task('default', ['build']);
