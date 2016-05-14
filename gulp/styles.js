import gulp from 'gulp';
import sass from 'gulp-sass';

gulp.task('sass', () => {
  return gulp.src('./client/assets/sass/{**,*}.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./client/assets/css'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./client/assets/sass/{**,*}.sass', ['sass']);
});
