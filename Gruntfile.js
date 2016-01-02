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
				reporter: 'spec'
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
		},
		clean: {
			dev: ['dev'],
			dist: ['dist'],
		}
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('default', ['dev']);

	grunt.registerTask('data', []);
	grunt.registerTask('dev', ['clean:dev', 'data', 'browserify:dev', 'copy:dev', 'uglify:dev']);
	grunt.registerTask('dist', ['clean:dist', 'data', 'browserify:dist', 'copy:dist', 'uglify:dist']);
	grunt.registerTask('test', ['build', 'data', 'mochaTest']);

	grunt.registerTask('build', 'build ivs.json', function () {
		require('./build.js')(this.async());
	});
};
