var http = require('http');
var fs = require('fs');
var zlib = require('zlib');

var tar = require('tar');
var async = require('async');
var request = require('request');
var byline = require('byline');

var DUMP_URL = 'http://glyphwiki.org/dump.tar.gz';
var IVD_URL = 'http://www.unicode.org/ivd/data/2014-05-16/IVD_Sequences.txt';

var SOURCES_DIR = './sources';
var DATA_DIR = './data';

// make SOURCES_DIR if not exists
if (!fs.existsSync(SOURCES_DIR)) {
	fs.mkdirSync(SOURCES_DIR);
}
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR);
}

var alias = {};
var IVD = {};
var aliasGroup = {};
var minAliasGroup = {};
var minMap = {};

var resolveAlias = function (charCode) {
	while (alias[charCode] !== undefined) charCode = alias[charCode];

	return charCode;
};

var recordInGroup = function (alias, charCode) {
	if (aliasGroup[alias] === undefined) {
		aliasGroup[alias] = [];
	}

	aliasGroup[alias].push(charCode);
};

// pseudo-base64
var base64 = function (n) {
	var ret = '';
	var charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@_'

	while (n !== 0) {
		ret = ret + charset[n % 64];
		n = Math.floor(n / 64);
	}

	return ret;
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
			},
			// parse dump file
			function (done) {
				var read = fs.createReadStream(SOURCES_DIR + '/dump_newest_only.txt');
				read.on('error', done);

				var parseLine = byline.createStream();
				parseLine.on('error', done);

				parseLine.on('data', function (line) {
					var columns = line.toString().split('|');

					if (columns.length !== 3) {
						return;
					}

					columns = columns.map(function (column) {
						return column.trim();
					});

					var aliasMatch = columns[2].match(new RegExp('^99:0:0:0:0:200:200:([^:]+)$'));
					if (aliasMatch) {
						var aliasedTo = aliasMatch[1];
						alias[columns[0]] = aliasedTo;
					}
				});

				parseLine.on('finish', function () {
					console.log('Dump file parsing finished.');
					done();
				});

				read.pipe(parseLine);
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
			// download IVD data
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
			},
			// parse IVD data
			function (done) {
				var read = fs.createReadStream(SOURCES_DIR + '/IVD_Sequences.txt');
				read.on('error', done);

				var parseLine = byline.createStream();
				parseLine.on('error', done);

				parseLine.on('data', function (line) {
					line = line.toString();

					if (line.slice(0, 1) === '#') {
						return;
					}

					var columns = line.split(';');

					if (columns.length !== 3) {
						return;
					}

					columns = columns.map(function (column) {
						return column.trim();
					});

					var shortName;

					switch (columns[1]) {
						case 'Adobe-Japan1':
							shortName = 'AJ';
							break;
						case 'Hanyo-Denshi':
						case 'Moji_Joho':
							shortName = 'HD';
							break;
					}

					if (!shortName) {
						return;
					}

					var codePoints = columns[0].split(' ');

					if (IVD[codePoints[0]] === undefined) {
						IVD[codePoints[0]] = {};
					}

					IVD[codePoints[0]][codePoints[1]] = [shortName];
				});

				parseLine.on('finish', function () {
					console.log('IVD file parsing finished.');
					done();
				});

				read.pipe(parseLine);
			}
		], done);
	}
], function (error) {
	if (error) {
		console.error(error);
		return;
	}

	console.log('Parsing completed.');

	// resolve aliases in IVD

	for (var firstCode in IVD) if (IVD.hasOwnProperty(firstCode)) {
		for (var secondCode in IVD[firstCode]) if (IVD[firstCode].hasOwnProperty(secondCode)) {
			var glyphName = 'u' + firstCode.toLowerCase() + '-u' + secondCode.toLowerCase();
			var resolved = resolveAlias(glyphName);
			IVD[firstCode][secondCode].push(resolved);
			recordInGroup(resolved, glyphName);
		}

		var standardGlyph = 'u' + firstCode.toLowerCase();
		IVD[firstCode].std = resolveAlias(standardGlyph);
		recordInGroup(IVD[firstCode].std, standardGlyph);
	}

	// minify aliases

	var cnt = 0;

	for (var aliasName in aliasGroup) if (aliasGroup.hasOwnProperty(aliasName)) {
		var aliases = aliasGroup[aliasName];
		if (aliases.length >= 2) {
			var minAliasName = base64(cnt);
			cnt++;

			minAliasGroup[minAliasName] = aliases;
			minMap[aliasName] = minAliasName;
		}
	}

	// minify aliases in IVD

	for (var firstCode in IVD) if (IVD.hasOwnProperty(firstCode)) {
		for (var secondCode in IVD[firstCode]) if (IVD[firstCode].hasOwnProperty(secondCode)) {
			if (secondCode === 'std') {
				aliasName = IVD[firstCode][secondCode];
				minAliasName = minMap[aliasName];
				if (minAliasName === undefined) {
					IVD[firstCode][secondCode] = '';
				} else {
					IVD[firstCode][secondCode] = minAliasName;
				}
			} else {
				aliasName = IVD[firstCode][secondCode][1];
				minAliasName = minMap[aliasName];
				if (minAliasName === undefined) {
					IVD[firstCode][secondCode][1] = '';
				} else {
					IVD[firstCode][secondCode][1] = minAliasName;
				}
			}
		}
	}

	console.log('Compile finished.')

	// write down to json

	fs.writeFile(DATA_DIR + '/ivd.json', JSON.stringify({
		IVD: IVD,
		aliases: minAliasGroup
	}), function (error) {
		if (error) {
			console.error(error);
			return;
		}

		console.log('Compiled file created.');
	});
});
