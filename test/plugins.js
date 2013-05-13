/**
 * User: jo
 * Date: 14.05.13
 * Time: 14:41
 *
 * Test plugins func
 */

var should = require('should'),
	Proxy = require('../lib/ProxyServer.js'),
	tools = require('../lib/tools.js');

/**
 * Test for plugins
 */
describe('plugins', function () {
	var plugins = Proxy.plugins;

	/**
	 * Test for replaceParamsInHash
	 */
	describe('#replaceParamsInHash', function () {
		var func = plugins.replaceParamsInHash;

		it("should change hash, replace bar and doesn't change raw", function (done) {
			var raw = new Buffer('GET /index?bar=1&foo=2 HTTP/1.1\r\nHost: localhost\r\n\r\n'),
				hash = tools.getHash().update(raw).end(),
				plugin = func({ bar: 2 });

			var obj = { raw: raw, hash: hash };

			plugin(obj, function (err) {
				should.not.exist(err);

				//data doesn't changed
				obj.raw.should.eql(raw);

				var newHash = tools.getHash()
						.update('GET /index?bar=2&foo=2 HTTP/1.1\r\nHost: localhost\r\n\r\n').end();

				obj.hash.should.not.eql(hash);
				obj.hash.should.eql(newHash);

				done();
			});
		});
	});

});