var should = require('should');
var data = require('./append.json');
var IVS = require('../');

describe('IVS.append()', function () {
	data.normal.forEach(function (datum) {
		it('should correctly append IVSes for each options', function () {
			IVS.append(datum.noIVS).should.equal(datum.AJ);

			IVS.append(datum.noIVS, {
				category: 'AJ'
			}).should.equal(datum.AJ);

			IVS.append(datum.noIVS, {
				category: 'HD'
			}).should.equal(datum.HD);

			IVS.append(datum.noIVS, {
				category: 'AJonly'
			}).should.equal(datum.AJonly);

			IVS.append(datum.noIVS, {
				category: 'HDonly'
			}).should.equal(datum.HDonly);
		});
	});

	data.force.forEach(function (datum) {
		it('should force appending if options.force is set true', function () {
			IVS.append(datum.noIVS).should.equal(datum.force);

			IVS.append(datum.noIVS, {
				force: true
			}).should.equal(datum.force);

			IVS.append(datum.noIVS, {
				force: false
			}).should.equal(datum.noForce);
		});
	});

	data.resolve.forEach(function (datum) {
		it('should correctly resolve IVSes mapped to other code points', function () {
			IVS.append(datum.noIVS).should.equal(datum.noResolve);

			IVS.append(datum.noIVS, {
				resolve: true
			}).should.equal(datum.resolve);

			IVS.append(datum.noIVS, {
				resolve: false
			}).should.equal(datum.noResolve);
		});
	});
});
