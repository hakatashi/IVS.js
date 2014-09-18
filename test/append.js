var should = require('should');
var data = require('./append.json');
var IVS = require('../');

describe('IVS.append()', function () {
	data.normal.forEach(function (datum) {
		it('should correctly append IVSes for each options', function (done) {
			var ivs = new IVS(function () {
				ivs.append(datum.noIVS).should.equal(datum.AJ);

				ivs.append(datum.noIVS, {
					category: 'AJ'
				}).should.equal(datum.AJ);

				ivs.append(datum.noIVS, {
					category: 'HD'
				}).should.equal(datum.HD);

				ivs.append(datum.noIVS, {
					category: 'AJonly'
				}).should.equal(datum.AJonly);

				ivs.append(datum.noIVS, {
					category: 'HDonly'
				}).should.equal(datum.HDonly);

				done();
			});
		});
	});

	data.force.forEach(function (datum) {
		it('should force appending if options.force is set true', function (done) {
			var ivs = new IVS(function () {
				ivs.append(datum.noIVS).should.equal(datum.force);

				ivs.append(datum.noIVS, {
					force: true
				}).should.equal(datum.force);

				ivs.append(datum.noIVS, {
					force: false
				}).should.equal(datum.noForce);

				done();
			});
		});
	});

	data.resolve.forEach(function (datum) {
		it('should correctly resolve IVSes mapped to other code points', function (done) {
			var ivs = new IVS(function () {
				ivs.append(datum.noIVS).should.equal(datum.noResolve);

				ivs.append(datum.noIVS, {
					resolve: true
				}).should.equal(datum.resolve);

				ivs.append(datum.noIVS, {
					resolve: false
				}).should.equal(datum.noResolve);

				done();
			});
		});
	});
});
