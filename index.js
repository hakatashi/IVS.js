var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');

if (typeof __dirname === 'undefined') {
	if (document) {
		var scripts = document.getElementsByTagName('script');
		var scriptPath = scripts[scripts.length - 1].src.split('?')[0];
		var __dirname = scriptPath.split('/').slice(0, -1).join('/');
	} else {
		throw new Error('Cannot get current directory');
	}
}

var IVS_REGEX = new RegExp('\uDB40[\uDD00-\uDDEF]');
var KANJI_REGEX = new RegExp('[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]');
var KANJI_SURROGATE_REGEX = new RegExp('[\uD840-\uD86E][\uDC00-\uDFFF]');

// http://youmightnotneedjquery.com/#deep_extend
var deepExtend = function(out) {
	out = out || {};

	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i];

		if (!obj)
			continue;

		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (typeof obj[key] === 'object')
					deepExtend(out[key], obj[key]);
				else
					out[key] = obj[key];
			}
		}
	}

	return out;
};

var map = function (value, mapObject) {
	for (var key in mapObject) {
		if (mapObject.hasOwnProperty(key) && value === key) {
			return mapObject[key];
		}
	}

	return null;
};

var parseKanji = function (string) {
	if (string.length <= 2) {
		return {
			kanji: string,
			ivs: ''
		};
	} else {
		return {
			kanji: string.slice(0, -2),
			ivs: string.slice(-2)
		};
	}
}

function IVS() {
	var options, callback;

	for (var i = 0; i < arguments.length; i++) {
		var argument = arguments[i];

		if (typeof argument === 'function') {
			callback = argument;
		} else if (typeof argument === 'object') {
			options = argument;
		}
	}

	options = options || {};
	callback = callback || function () {};

	this.initialize(options, callback);
}

IVS.prototype.initialize = function (options, callback) {
	var ivs = this;

	if (ivs.IVD === undefined) {
		var dataJSON = '';

		function onJSONReady() {
			try {
				IVS.prototype.IVD = JSON.parse(dataJSON);
			} catch (error) {
				return callback(new Error('ivd.json is broken'));
			}

			callback.call(ivs, null);
		}

		if (typeof location !== 'undefined') { // in browser
			var get = location.protocol === 'https:' ? https.get : http.get;
			var dataURL = options.ivd ? url.resolve(location.href, options.ivd) : (__dirname + '/ivd.json')

			var request = get(dataURL, function (response) {
				if (response.statusCode !== 200) {
					callback(new Error('Request to ' + dataURL + ' responded with status code ' + response.statusCode));
				}

				response.on('error', callback);
				response.on('data', function (chunk) { dataJSON += chunk; });
				response.on('close', onJSONReady);
			});
		} else { // in node
			fs.readFile(__dirname + '/data/ivd.json', function (error, data) {
				if (error) return callback(error);
				dataJSON = data;
				onJSONReady();
			});
		}
	} else {
		setTimeout(function () {
			callback.call(ivs, null);
		}, 0);
	}
};

/**
 * Execute function for each Kanji and IVS (if exists) in given string
 * @param {string} string - The string in which this function seeks for Kanji
 * @param {KanjiCallback} callback - The function called every time when Kanji was found
 */
IVS.prototype.forEachKanji = function (string, callback) {
	var size = string.length;
	var ret = '';

	for (var index = 0; index < size; index++) {
		var kanji = '';
		var ivs = '';
		var foundIndex = index;

		if (string[index].match(KANJI_REGEX)) {
			kanji = string[index];
		} else if (index + 1 < size
		           && string.substr(index, 2).match(KANJI_SURROGATE_REGEX)) {
			kanji = string.substr(index, 2);
			index++;
		} else {
			kanji = null;
			ret += string[index];
		}

		if (kanji) {
			// if string is still capable for having IVS
			if (index + 2 < size
			    && (string.substr(index + 1, 2).match(IVS_REGEX))) {
				ivs = string.substr(index + 1, 2);
				index += 2;
			}

			ret += callback(kanji, ivs, foundIndex);
		}
	}

	return ret;
};

/**
 * @callback KanjiCallback
 * @param {string} kanji - Found Kanji string
 * @param {string} ivs - The IVS allocated to found Kanji string. No length if not exists.
 * @param {number} index - The index where the Kanji found in given string
 * @returns {string} The string which the found kanji will be replaced by
 */

/**
 * Unify IVSes in the given string to the given type
 * @param  {string} category - The IVS category to which the IVSes will be unified to. `'Aj'` and `'HD'` are supported.
 * @param  {string} string -
 * @return {string} IVS-Unified string
 */
IVS.prototype.unify = function (category, string) {
	var IVS = this;
	var IVD = this.IVD;

	return IVS.forEachKanji(string, function (kanji, ivs, index) {
		if (!ivs) return kanji;
		if (!IVD.IVD[kanji]) return kanji + ivs;
		if (!IVD.IVD[kanji][ivs]) return kanji + ivs;

		var info = IVD.IVD[kanji][ivs];

		if (info[0] === category) return kanji + ivs;

		var aliasName = info[1];

		if (aliasName === '') return kanji + ivs;

		var unified = null;
		IVD.aliases[aliasName].forEach(function (alias) {
			var parsed = parseKanji(alias);
			if (parsed.kanji === kanji && parsed.ivs) {
				if (IVD.IVD[parsed.kanji][parsed.ivs][0] === category) {
					unified = alias;
				}
			}
		});

		if (unified) {
			return unified;
		} else {
			return kanji + ivs;
		}
	});
};

/**
 * Unify IVSes in given string to Adobe-Japan1. Same as IVS.unify('AJ', string).
 * @param {string} string -
 */
IVS.prototype.AJ = function (string) {
	return this.unify('AJ', string);
};

/**
 * Unify IVSes in given string to Hanyo-Denshi. Same as IVS.unify('HD', string).
 * @param {string} string -
 */
IVS.prototype.HD = function (string) {
	return this.unify('HD', string);
};

/**
 * Completely strip IVSes from given string.
 * @param  {string} string -
 * @param {object} options - The options object
 * @param {boolean} options.resolve - Some of the default glyphs in GlyphWiki is linked to IVDes of other code points. This option resolves mapping to other code points as conversion. Default is `false`.
 * @return {string} - IVS-stripped string
 */
IVS.prototype.strip = function (string, options) {
	var IVS = this;
	var IVD = this.IVD;

	var defaults = {
		resolve: false,
	};

	if (typeof options === 'object') {
		options = deepExtend(defaults, options);
	} else {
		options = defaults;
	}

	if (options.resolve) {
		string = IVS.forEachKanji(string, function (kanji, ivs) {
			if (!ivs) return kanji;
			if (IVD.IVD[kanji] === undefined) return kanji;
			if (IVD.IVD[kanji][ivs] === undefined) return kanji;

			if (IVD.IVD[kanji][ivs][1] !== '') {
				var aliasName = IVD.IVD[kanji][ivs][1];
				var resolved = null;

				IVD.aliases[aliasName].forEach(function (alias) {
					var parsed = parseKanji(alias);
					if (!parsed.ivs) {
						if (!resolved || parsed.kanji === kanji) {
							resolved = parsed.kanji;
						}
					}
				});

				if (resolved) {
					return resolved;
				} else {
					return kanji;
				}
			} else {
				return kanji;
			}
		});
	}

	return string.replace(new RegExp('\uDB40[\uDD00-\uDDEF]', 'g'), '');
};

/**
 * Append IVSes for non-IVSed kanjies in given string using default glyphs in GlyphWiki.
 * @param {string} string -
 * @param {object} options - The options object
 * @param {string} options.category - The IVS category used to append IVS which is the one of `'AJ'`, `'HD'`, `'AJonly'`, `'HDonly'`. Default is `'AJ'`.
 * @param {boolean} options.force - This option forces to append U+E0100 if default glyph was not found in IVD. This doesn't affect kanjies which is not documented in IVD. Default is `true`.
 * @param {boolean} options.resolve - Some of the default glyphs in GlyphWiki is linked to IVDes of other code points. This option resolves mapping to other code points as conversion. Default is `false`.
 * @return {string} - IVSed string
 */
IVS.prototype.append = function (string, options) {
	var IVS = this;

	var defaults = {
		category: 'AJ',
		force: true,
		resolve: false,
	};

	if (typeof options === 'object') {
		options = deepExtend(defaults, options);
	} else {
		options = defaults;
	}

	var priorities = map(options.category, {
		AJ: ['AJ', 'HD'],
		HD: ['HD', 'AJ'],
		AJonly: ['AJ'],
		HDonly: ['HD'],
	});

	return IVS.forEachKanji(string, function (kanji, ivs, index) {
		if (ivs) return kanji + ivs;
		if (IVS.IVD.IVD[kanji] === undefined) return kanji;

		if (IVS.IVD.IVD[kanji].std === '') {
			if (options.force && IVS.IVD.IVD[kanji]['\uDB40\uDD00'] !== undefined) {
				return kanji + '\uDB40\uDD00';
			} else {
				return kanji;
			}
		} else {
			var aliasName = IVS.IVD.IVD[kanji].std;
			var IVSed = null;

			priorities.forEach(function (category) {
				if (IVSed) return;

				IVS.IVD.aliases[aliasName].forEach(function (alias) {
					if (IVSed) return;

					var parsed = parseKanji(alias);
					if ((options.resolve || parsed.kanji === kanji) && parsed.ivs) {
						if (IVS.IVD.IVD[parsed.kanji][parsed.ivs][0] === category) {
							IVSed = parsed.kanji + parsed.ivs;
						}
					}
				});
			});

			if (IVSed) {
				return IVSed;
			} else {
				return kanji;
			}
		}
	});
};

module.exports = IVS;
