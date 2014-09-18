var should = require('should');
var data = require('./unify.json');
var IVS = require('../');

describe('IVS.unify()', function () {
	data.compatible.forEach(function (datum) {
		it('should correctly unify HD IVSes into AJ IVSes', function (done) {
			var ivs = new IVS(function () {
				ivs.AJ(datum.HD).should.equal(datum.AJ);

				done();
			});
		});

		it('should correctly unify AJ IVSes into HD IVSes', function (done) {
			var ivs = new IVS(function () {
				ivs.HD(datum.AJ).should.equal(datum.HD);

				done();
			});
		});

		it('should correctly unify AJ/HD mixed IVSes', function (done) {
			var ivs = new IVS(function () {
				ivs.AJ(datum.mixed).should.equal(datum.AJ);
				ivs.HD(datum.mixed).should.equal(datum.HD);

				done();
			});
		});
	});

	data.AJincompatible.forEach(function (datum) {
		it('should leave AJ-incompatible kanjies untouched when unifying HD IVSes into AJ IVSes', function (done) {
			var ivs = new IVS(function () {
				ivs.AJ(datum.HD).should.equal(datum.AJ);

				done();
			});
		});
	});

	data.HDincompatible.forEach(function (datum) {
		it('should leave HD-incompatible kanjies untouched when unifying AJ IVSes into HD IVSes', function (done) {
			var ivs = new IVS(function () {
				ivs.HD(datum.AJ).should.equal(datum.HD);

				done();
			});
		});
	});

	data.surrogate.forEach(function (datum) {
		it('should correctly treat IVSes which uses kanjies from surrogate pairs', function (done) {
			var ivs = new IVS(function () {
				ivs.AJ(datum.HD).should.equal(datum.AJ);
				ivs.HD(datum.AJ).should.equal(datum.HD);

				done();
			});
		});
	});
});
