var http = require('http');
var fs = require('fs');
var zlib = require('zlib');

var tar = require('tar');
var async = require('async');
var request = require('request');
var byline = require('byline');

var DUMP_URL = 'http://glyphwiki.org/dump.tar.gz';
var IVD_URL = 'http://www.unicode.org/ivd/data/2016-08-15/IVD_Sequences.txt';

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

var recordInGroup = function (alias, string) {
	if (aliasGroup[alias] === undefined) {
		aliasGroup[alias] = [];
	}

	aliasGroup[alias].push(string);
};

// pseudo-base64
var base64 = function (n) {
	var ret = '';
	var charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@_'

	if (n === 0) return charset[0];

	while (n !== 0) {
		ret = charset[n % 64] + ret;
		n = Math.floor(n / 64);
	}

	return ret;
}

// ES6 String.fromCodePoint polyfilling
/*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
var fromCodePoint = function (codePoints) {
	var MAX_SIZE = 0x4000;
	var codeUnits = [];
	var highSurrogate;
	var lowSurrogate;
	var index = -1;
	var length = arguments.length;
	if (!length) {
		return '';
	}
	var result = '';
	while (++index < length) {
		var codePoint = Number(arguments[index]);
		if (
			!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
			codePoint < 0 || // not a valid Unicode code point
			codePoint > 0x10FFFF || // not a valid Unicode code point
			Math.floor(codePoint) != codePoint // not an integer
		) {
			throw RangeError('Invalid code point: ' + codePoint);
		}
		if (codePoint <= 0xFFFF) { // BMP code point
			codeUnits.push(codePoint);
		} else { // Astral code point; split in surrogate halves
			// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
			codePoint -= 0x10000;
			highSurrogate = (codePoint >> 10) + 0xD800;
			lowSurrogate = (codePoint % 0x400) + 0xDC00;
			codeUnits.push(highSurrogate, lowSurrogate);
		}
		if (index + 1 == length || codeUnits.length > MAX_SIZE) {
			result += String.fromCharCode.apply(null, codeUnits);
			codeUnits.length = 0;
		}
	}
	return result;
};

// ES6 String.prototype.codePointAt pseudo-polyfilling
/*! http://mths.be/codepointat v0.1.0 by @mathias */
var toCodePoint = function (string) {
	var size = string.length;
	var index = 0;
	// Get the first code unit
	var first = string.charCodeAt(index);
	var second;
	if ( // check if it’s the start of a surrogate pair
		first >= 0xD800 && first <= 0xDBFF && // high surrogate
		size > index + 1 // there is a next code unit
	) {
		second = string.charCodeAt(index + 1);
		if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
			// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
			return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
		}
	}
	return first;
};

module.exports = function (done) {
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

						var extract = new tar.Parse();
						extract.on('error', done);
						extract.on('entry', function (entry) {
							if (entry.path === 'dump_newest_only.txt') {
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

					var kanjiSpans = [
						{from: 0x3400, to: 0x4DBF}, // CJK Extension A
						{from: 0x4E00, to: 0x9FFF}, // CJK
						{from: 0xF900, to: 0xFAFF}, // CJK Compatibility
						{from: 0x20000, to: 0x2A6DF}, // CJK Extension B
						{from: 0x2A700, to: 0x2B73F}, // CJK Extension C
						{from: 0x2B740, to: 0x2B81F}, // CJK Extension D
					];

					parseLine.on('data', function (line) {
						var columns = line.toString().split('|');

						if (columns.length !== 3) {
							return;
						}

						columns = columns.map(function (column) {
							return column.trim();
						});

						// register kanji to IVD
						if (columns[0].match(new RegExp('^u[0-9a-f]{4,5}$'))) {
							var codePoint = parseInt(columns[0].slice(1), 16);

							if (kanjiSpans.some(function (span) {
								return span.from <= codePoint && codePoint <= span.to;
							})) {
								var kanji = fromCodePoint(codePoint);
								if (IVD[kanji] === undefined) {
									IVD[kanji] = {};
								}
							}
						}

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
						codePoints = codePoints.map(function (codePoint) {
							return fromCodePoint(parseInt(codePoint, 16));
						});

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
			var firstCodePoint = toCodePoint(firstCode).toString(16).toLowerCase();

			for (var secondCode in IVD[firstCode]) if (IVD[firstCode].hasOwnProperty(secondCode)) {
				var secondCodePoint = toCodePoint(secondCode).toString(16).toLowerCase();
				var glyphName = 'u' + firstCodePoint + '-u' + secondCodePoint;
				var resolved = resolveAlias(glyphName);
				IVD[firstCode][secondCode].push(resolved);
				recordInGroup(resolved, firstCode + secondCode);
			}

			var standardGlyph = 'u' + firstCodePoint;
			IVD[firstCode].std = resolveAlias(standardGlyph);
			recordInGroup(IVD[firstCode].std, firstCode);
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

		// remove unlinked kanjies from IVD

		for (var firstCode in IVD) if (IVD.hasOwnProperty(firstCode)) {
			if (Object.keys(IVD[firstCode]).length === 1 && IVD[firstCode].std === '') {
				delete IVD[firstCode];
			}
		}

		console.log('Compile finished.')

		// write down to json

		fs.writeFile(DATA_DIR + '/ivd.json', JSON.stringify({
			IVD: IVD,
			aliases: minAliasGroup
		}), function (error) {
			if (error) {
				done(error);
				return;
			}

			console.log('Compiled file created.');
			done();
		});
	});
};
