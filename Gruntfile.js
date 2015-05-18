module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src : 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-serve');
  
  // Default task(s).
  grunt.registerTask('default', ['convert_style', 'uglify']);
  
  // My custom grunt tasks:
  grunt.registerTask('convert_style', 
    'Convert css style file to the js object note to inject in a shadow dom. ', 
    function() {
      
      var done = this.async();
      
      var fs       = require('fs'),
          CleanCSS = require('clean-css'),
          fileSrc  = 'src/charts.css',
          fileOut  = 'src/styles.js',
          tmpl     = "'use strict';window.__sc_cs ='{{styles}}';";
      
      fs.readFile(fileSrc, function(err, data){
        if (err) throw err;
        grunt.log.writeln('Read file:'+fileSrc);
        
        grunt.log.writeln('Minify data');
        var minifiedData = new CleanCSS().minify(data).styles,
            outData = tmpl.replace('{{styles}}', minifiedData);
        
        fs.writeFile(fileOut, outData, function (err) {
          if (err) throw err;
          grunt.log.writeln('Style file has bean saved to:'+fileOut);
        });
        
      });
    
    });

};
