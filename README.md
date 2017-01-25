IVS.js
======

[![Build Status](https://travis-ci.org/hakatashi/IVS.js.svg?branch=master)](https://travis-ci.org/hakatashi/IVS.js)
[![Greenkeeper badge](https://badges.greenkeeper.io/hakatashi/IVS.js.svg)](https://greenkeeper.io/)

Node.js module that supplies mutual IVS conversion between Adobe-Japan and Hanyo-denshi(Moji_Joho).

This package includes database for mutual conversion of IVS,
which is generated from [GlyphWiki](http://glyphwiki.org/)'s aliasing information.

## Install

    npm install ivs

## Use

``` javascript
var IVS = require('ivs');
var ivs = new IVS(function () {
    ivs.HD('葛󠄁飾󠄀区󠄀'); // -> '葛󠄃飾󠄂区󠄀'
});
```

## Usage

### new IVS([options], [callback])

Constructor.

* `options`: Object, options.
  - `options.ivd`: String, the path to `ivd.json` file. Valid only in browser.
    Default is the same directory to the ivs.js file.
* `callback`: Function(error), called when IVS converter is ready.
  - `error`: Error, supplied if construction failed.

### ivs.unify(category, string)

Unify IVSes in the given string to the given type

* `category`: String, The IVS category to which the IVSes will be unified to. `'AJ'` and `'HD'` are supported.
* `string`: String, to convert.
* Returns: String, IVS-Unified string

### ivs.AJ(string)

Unify IVSes in given string to Adobe-Japan1. Alias to IVS.unify('AJ', string).

* `string`: String, to convert.

### ivs.HD(string)

Unify IVSes in given string to Hanyo-Denshi. Alias to IVS.unify('HD', string).

* `string`: String, to convert.

### ivs.strip(string, [options])

Completely strip IVSes from given string.

* `string`: String, to convert.
* `options`: Object, options.
  - `options.resolve`: Boolean, Some of the default glyphs in GlyphWiki is linked to IVDes of other code points.
    This option resolves mapping to other code points as conversion. Default is `false`.
* Returns: String, IVS-stripped string

### ivs.append(string, [options])

Append IVSes for non-IVSed kanjies in given string using default glyphs in GlyphWiki.

* `string`: String, to convert.
* `options`: Object, options.
  - `options.category`: String, The IVS category used to append IVS which is the one of
    `'AJ'`, `'HD'`, `'AJonly'`, `'HDonly'`. Default is `'AJ'`.
  - `options.force`: Boolean, This option forces to append U+E0100 if default glyph was not found in IVD.
    Note that this doesn't affect kanjies which is not documented in IVD. Default is `true`.
  - `options.resolve`: Boolean, Some of the default glyphs in GlyphWiki is linked to IVDes of other code points.
    This option resolves mapping to other code points as conversion. Default is `false`.
* Returns: String, IVSed string.

### ivs.forEachKanji(string, callback)

Execute function for each Kanji and IVS (if exists) in given string

* `string`: String, in which this function seeks for Kanji
* `callback`: Function(kanji, ivs, index), called every time when Kanji was found
  - `kanji`: String, the IVS-stripped version of found kanji.
  - `ivs`: String, stacking IVS of found kanji. If no IVS is stacking, zero-length string is supplied.
  - `index`: Number, index of found kanji in given string.
