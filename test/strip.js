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

	data.resolve.forEach(function (datum) {
		it('should correctly resolve IVSes mapped to other code points', function () {
			IVS.strip(datum.IVSed).should.equal(datum.noResolve);

			IVS.strip(datum.IVSed, {
				resolve: true
			}).should.equal(datum.resolve);

			IVS.strip(datum.IVSed, {
				resolve: false
			}).should.equal(datum.noResolve);
		})
	})
});
