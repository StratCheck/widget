module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src : [
          'src/ShadowDOM.js', 
          'bower_components/lodash/lodash.js',
          'bower_components/moment/moment.js',
          'bower_components/switchery/dist/switchery.js',
          
          'src/buisness_moment.js', 
          'src/styles.js', 
          'src/tmpl.js', 
          'src/<%= pkg.name %>.js'
        ],
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: [
          'bower_components/d3/d3.min.js', 
          'build/<%= pkg.name %>.js'
        ],
        dest: 'build/<%= pkg.name %>.min.js',
      },
    },
    convert_style : {
      'src'  : 'src/charts.css',
      'dest' : 'src/styles.js'
    },
    convert_template : {
      'src'  : 'src/template.html',
      'dest' : 'src/tmpl.js'
    }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-serve');
  
  grunt.loadNpmTasks('grunt-contrib-concat');
  
  
  // Default task(s).
  grunt.task.registerTask(
    'default', 
    [
      'convert_template',
      'convert_style', 
      'uglify:build', 
      'concat'
    ]);
  
  grunt.task.registerTask(
    'build_prod', 
    [
      'convert_template',
      'convert_style', 
      'uglify:build', 
      'concat'
    ]);
  
  grunt.task.registerTask('precompileassets', ['convert_template', 'convert_style']);
  
  // My custom grunt tasks:
  grunt.registerTask('convert_style', 
    'Convert css style file to the js object note to inject in a shadow dom. ', 
    function() {
      
      var done = this.async();
      
      var fs       = require('fs'),
          CleanCSS = require('clean-css'),
          opts     = grunt.config.get('convert_style'),
          fileSrc  = opts.src  ? opts.src  : 'src/charts.css',
          fileOut  = opts.dest ? opts.dest : 'src/styles.js',
          tmpl     = "'use strict';window.__sc_cs ='{{styles}}';";
      
      fs.readFile(fileSrc, {encoding: "utf8"}, function(err, data){
        if (err){
          done(false);
          throw err;
        }
        grunt.log.writeln('Read file:'+fileSrc);
        
        grunt.log.writeln('Minify css data.');
        var minifiedData = new CleanCSS().minify(data).styles,
            outData = tmpl.replace('{{styles}}', minifiedData);
        
        fs.writeFile(fileOut, outData, function (err) {
          if (err){
            done(false);
            throw err;
          }
          grunt.log.writeln('Style file has bean saved to:'+fileOut);
          done(true);
        });
        
      });
    
    });
    
  grunt.registerTask('convert_template', 
    'Convert template html file to the js', 
    function() {
      
      var done = this.async();
      
      var fs      = require('fs'),
          minify  = require('html-minifier').minify,
          opts    = grunt.config.get('convert_template'),
          fileSrc = opts.src  ? opts.src  : 'src/template.html',
          fileOut = opts.dest ? opts.dest : 'src/tmpl.js',
          tmpl    = "'use strict';window.__sc_tmpl ='{{template}}';";
      
      fs.readFile(fileSrc, {encoding: "utf-8"}, function(err, data){

        if (err) {
          done(false);
          throw err;
        }
        grunt.log.writeln('Read file:'+fileSrc);
        
        grunt.log.writeln('Minify html data.');

        var minifiedData = minify(data, {collapseWhitespace: true});
        var outData = tmpl.replace('{{template}}', minifiedData);
        
        fs.writeFile(fileOut, outData, function (err) {
          if (err) {
            done(false);
            throw err;
          }
          grunt.log.writeln('Template file has bean saved to:'+fileOut);
          done(true);
        });
        
      });
    
    });

};
