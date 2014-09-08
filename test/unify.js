var should = require('should');
var data = require('./unify.json');
var IVS = require('../');

describe('IVS.unify()', function () {
	data.forEach(function (datum) {
		it('should correctly unify HD IVSes into AJ IVSes', function () {
			IVS.AJ(datum.HD).should.equal(datum.AJ);
		});

		it('should correctly unify AJ IVSes into HD IVSes', function () {
			IVS.HD(datum.AJ).should.equal(datum.HD);
		});

		it('should correctly unify AJ/HD mixed IVSes', function () {
			IVS.AJ(datum.mixed).should.equal(datum.AJ);
			IVS.HD(datum.mixed).should.equal(datum.HD);
		});
	});
});
