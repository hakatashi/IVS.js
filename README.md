IVS.js
======

Node.js module that supplies mutual IVS conversion between Adobe-Japan and Hanyo-denshi(Moji_Joho).

## Install

    npm install ivs

## Use

    var IVS = require('ivs');

## Usage

forEachKanji(string, callback)
-----------------------------
Execute function for each Kanji and IVS (if exists) in given string

**Parameters**

**string**: string, The string in which this function seeks for Kanji

**callback**: KanjiCallback, The function called every time when Kanji was found


unify(category, string)
-----------------------------
Unify IVSes in the given string to the given type

**Parameters**

**category**: string, The IVS category to which the IVSes will be unified to. `'Aj'` and `'HD'` are supported.

**string**: string, Unify IVSes in the given string to the given type

**Returns**: string, IVS-Unified string

AJ(string)
-----------------------------
Unify IVSes in given string to Adobe-Japan1. Same as IVS.unify('AJ', string).

**Parameters**

**string**: string, Unify IVSes in given string to Adobe-Japan1. Same as IVS.unify('AJ', string).


HD(string)
-----------------------------
Unify IVSes in given string to Hanyo-Denshi. Same as IVS.unify('HD', string).

**Parameters**

**string**: string, Unify IVSes in given string to Hanyo-Denshi. Same as IVS.unify('HD', string).


strip(string)
-----------------------------
Completely strip IVSes from given string.

**Parameters**

**string**: string, Completely strip IVSes from given string.

**Returns**: string, - IVS-stripped string

append(string, options, options.category, options.force)
-----------------------------
Append IVSes for non-IVSed kanjies in given string using default glyphs in GlyphWiki.

**Parameters**

**string**: string, Append IVSes for non-IVSed kanjies in given string using default glyphs in GlyphWiki.

**options**: object, The options object

**options.category**: string, The IVS category used to append IVS which is the one of `'AJ'`, `'HD'`, `'AJonly'`, `'HDonly'`. Default is `'AJ'`.

**options.force**: boolean, This option forces to append U+E0100 if default glyph was not found in IVD. This doesn't affect kanjies which is not documented in IVD. Default is `true`.

**Returns**: string, - IVSed string
