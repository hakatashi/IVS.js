var IVD = require('./data/ivd.json');

var IVS_REGEX = new RegExp('\uDB40[\uDD00-\uDDEF]');
var KANJI_REGEX = new RegExp('[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]');
var KANJI_SURROGATE_REGEX = new RegExp('[\uD840-\uD86E][\uDC00-\uDFFF]');

var IVS = {};

/**
 * Execute function for each Kanji and IVS (if exists) in given string
 * @param {string} string - The string in which this function seeks for Kanji
 * @param {IVSCallback} callback - The function called every time when Kanji was found
 */
IVS.forEachKanji = function (string, callback) {
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
 * @param  {string} string
 * @param  {string} category - The IVS category to which the IVSes will be unified to. `'Aj'` and `'HD'` are supported.
 * @return {string} IVS-Unified string
 */
IVS.unify = function (string, category) {
	
};

module.exports = IVS;
