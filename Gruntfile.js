module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify: {
			options: {
				ignore: ['zlib']
			},
			dev: {
				src: 'browser.js',
				dest: 'dev/ivs.js'
			},
			dist: {
				src: 'browser.js',
				dest: 'dist/ivs.js'
			},
		},
		mochaTest: {
			options: {
				reporter: 'nyan'
			},
			src: ['test/**/*.js']
		},
		uglify: {
			dev: {
				src: 'dev/ivs.js',
				dest: 'dev/ivs.min.js'
			},
			dist: {
				src: 'dist/ivs.js',
				dest: 'dist/ivs.min.js'
			}
		},
		copy: {
			dev: {
				src: 'data/ivd.json',
				dest: 'dev/ivd.json'
			},
			dist: {
				src: 'data/ivd.json',
				dest: 'dist/ivd.json'
			}
		}
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('default', ['dev']);

	grunt.registerTask('data', []);
	grunt.registerTask('dev', ['data', 'browserify:dev', 'copy:dev', 'uglify:dev']);
	grunt.registerTask('dist', ['data', 'browserify:dist', 'copy:dist', 'uglify:dist']);
	grunt.registerTask('test', ['data', 'mochaTest']);

	grunt.registerTask('build', 'build ivs.json', function () {
		require('./build.js')(this.async());
	});
};
