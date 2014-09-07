var http = require('http');
var fs = require('fs');
var zlib = require('zlib');

var tar = require('tar');
var async = require('async');
var request = require('request');

var DUMP_URL = 'http://glyphwiki.org/dump.tar.gz';
var IVD_URL = 'http://www.unicode.org/ivd/data/2014-05-16/IVD_Sequences.txt';

var SOURCES_DIR = './sources';

// make SOURCES_DIR if not exists
if (!fs.existsSync(SOURCES_DIR)) {
	fs.mkdirSync(SOURCES_DIR);
}

// fetch sources
async.parallel([
	// fetch the dump
	function (done) {
		async.waterfall([
			// check if dump file exists
			function (done) {
				fs.exists(SOURCES_DIR + '/dump_newest_only.txt', function (exists) {
					done(null, exists);
				});
			},
			// download dump file
			function (exists, done) {
				if (exists) {
					console.log('Dump file exists. Continue.')
					done();
				} else {
					var download = request(DUMP_URL);
					download.on('error', done);
					download.on('end', function () {
						console.log('Dump file download ended.');
					});

					var gunzip = zlib.createGunzip();
					gunzip.on('error', done);
					gunzip.on('finish', function () {
						console.log('Dump file gzip inflation finished.');
					});

					var extract = tar.Parse();
					extract.on('error', done);
					extract.on('entry', function (entry) {
						if (entry.props.path === 'dump_newest_only.txt') {
							var write = fs.createWriteStream(SOURCES_DIR + '/dump_newest_only.txt');
							write.on('error', done);
							write.on('finish', function () {
								console.log('Dump file writing finished.');
								done();
							});

							entry.pipe(write);
						}
					});

					download.pipe(gunzip).pipe(extract);
					console.log('Dump file downloading...');
				}
			}
		], done);
	},
	// fetch IVD
	function (done) {
		async.waterfall([
			// check if IVD file exists
			function (done) {
				fs.exists(SOURCES_DIR + '/IVD_Sequences.txt', function (exists) {
					done(null, exists);
				});
			},
			// download dump file
			function (exists, done) {
				if (exists) {
					console.log('IVD file exists. Continue.')
					done();
				} else {
					var download = request(IVD_URL);
					download.on('error', done);
					download.on('finish', function () {
						console.log('IVD file download finished.');
					});

					var write = fs.createWriteStream(SOURCES_DIR + '/IVD_Sequences.txt');
					write.on('error', done);
					write.on('finish', function () {
						console.log('IVD file writing finished');
						done();
					});

					download.pipe(write);
					console.log('IVD file downloading...');
				}
			}
		], done);
	}
], function (error) {
	if (error) {
		console.error(error);
		return;
	} else {
		console.log('Fetching completed.')
	}
});
