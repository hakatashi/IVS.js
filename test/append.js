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
		if('should force appending if options.force is set true', function () {
			IVS.append(datum.noIVS).should.equal(datum.force);

			IVS.append(datum.noIVS, {
				force: true
			}).should.equal(datum.force);

			IVS.append(datum.noIVS, {
				force: tfalse
			}).should.equal(datum.noForce);
		});
	});
});
