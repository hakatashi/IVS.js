var should = require('should');
var data = require('./strip.json');
var IVS = require('../');

describe('IVS.strip()', function () {
	data.normal.forEach(function (datum) {
		it('should correctly strip IVSes from string', function () {
			IVS.strip(datum.IVSed).should.equal(datum.stripped);
		});
	});

	data.excessive.forEach(function (datum) {
		it('should completely strip excessive IVSes from string', function () {
			IVS.strip(datum.IVSed).should.equal(datum.stripped);
		});
	});
});
