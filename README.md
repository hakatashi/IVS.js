IVS.js
======

Node.js module that supplies mutual IVS conversion between Adobe-Japan and Hanyo-denshi(Moji_Joho).

## Install

    npm install ivs

## Use

    var IVS = require('ivs');

## Manual

### IVS.unify(category, string)

Unify IVSes in the given string to the given type

**category**: string, The IVS category to which the IVSes will be unified to. `'AJ'` and `'HD'` are supported.

**string**: string, Unify IVSes in the given string to the given type

**Returns**: string, IVS-Unified string

### IVS.AJ(string)

Unify IVSes in given string to Adobe-Japan1. Same as IVS.unify('AJ', string).

### IVS.HD(string)

Unify IVSes in given string to Hanyo-Denshi. Same as IVS.unify('HD', string).

### IVD.forEachKanji(string, callback)

Execute function for each Kanji and IVS (if exists) in given string

**string**: string, The string in which this function seeks for Kanji

**callback**: KanjiCallback, The function called every time when Kanji was found
