var should = require('should');
var data = require('./strip.json');
var IVS = require('../');

describe('IVS.strip()', function () {
	data.normal.forEach(function (datum) {
		it('should correctly strip IVSes from string', function (done) {
			var ivs = new IVS(function () {
				ivs.strip(datum.IVSed).should.equal(datum.stripped);

				done();
			});
		});
	});

	data.excessive.forEach(function (datum) {
		it('should completely strip excessive IVSes from string', function (done) {
			var ivs = new IVS(function () {
				ivs.strip(datum.IVSed).should.equal(datum.stripped);

				done();
			});
		});
	});

	data.resolve.forEach(function (datum) {
		it('should correctly resolve IVSes mapped to other code points', function (done) {
			var ivs = new IVS(function () {
				ivs.strip(datum.IVSed).should.equal(datum.noResolve);

				ivs.strip(datum.IVSed, {
					resolve: true
				}).should.equal(datum.resolve);

				ivs.strip(datum.IVSed, {
					resolve: false
				}).should.equal(datum.noResolve);

				done();
			});
		});
	});
});
