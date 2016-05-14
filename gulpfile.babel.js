import gulp from 'gulp';
import sass from 'gulp-sass';
import read from 'fs-readdir-recursive';

/**
 *  This will load all js or coffee files in the gulp directory
 *  in order to load all gulp tasks
 */
read('./gulp', function(file){
  return (/\.(js)$/i).test(file);
}).map( file => {
  require('./gulp/' + file);
});


/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', ['sass:watch'], () => {});


