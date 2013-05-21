/**
 * User: jo
 * Date: 14.05.13
 * Time: 14:41
 *
 * Test plugins func
 */

var should = require('should'),
	url = require('url'),
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

	/**
	 * Test for modifyHash
	 */
	describe('#modifyHash', function () {
		var modifyHash = plugins.modifyHash;

		it('should call mod function and delegate parsed params', function (done) {
			var raw = new Buffer('POST /index?bar=1&foo=2 HTTP/1.1\r\nHost: localhost\r\n\r\nsome data'),
				hash = tools.getHash().update(raw).end(),
				is1 = false,
				is2 = false,
				urlObj = url.parse('/index?bar=1&foo=2', true),
				uri = {
					pathname: urlObj.pathname,
					query: urlObj.query
				};

			var obj = { raw: raw, hash: hash };

			function modfn1 (req, next) {
				is1 = true;
				req.should.have.property('_raw', raw);
				req.should.have.property('_hash', hash);
				req.should.have.property('method', 'POST');
				req.should.have.property('uri').and.obj.should.eql(uri);
				req.should.have.property('version', '1.1');
				req.should.have.property('headers').and.obj.should.eql({ 'Host': 'localhost' });
				req.should.have.property('body');
				next();
			}

			function modfn2 (req, next) {
				is2 = true;
				req.should.have.property('_raw', raw);
				req.should.have.property('_hash', hash);
				req.should.have.property('method', 'POST');
				req.should.have.property('uri').and.obj.should.eql(uri);
				req.should.have.property('version', '1.1');
				req.should.have.property('headers').and.obj.should.eql({ 'Host': 'localhost' });
				req.should.have.property('body');
				next();
			}

			var plugin = modifyHash([modfn1, modfn2]);

			plugin(obj, function (err) {
				is1.should.be.ok;
				is2.should.be.ok;

				done();
			});
		});

		it('should calculate new hash sum', function (done) {
			var raw = new Buffer('GET /index?bar=1&foo=2 HTTP/1.1\r\nHost: localhost\r\n\r\n'),
				hash = tools.getHash().update(raw).end(),
				expectHash = tools.getHash()
								.update(new Buffer('GET /index?bar=1&foo=4 HTTP/1.1\r\nHost: localhost1\r\n\r\n'))
								.end();

			var obj = { raw: raw, hash: hash };

			function mod(req, next) {
				req.uri.query.foo = 4;
				req.headers.Host = 'localhost1';
				next();
			}

			var plugin = modifyHash([mod]);

			plugin(obj, function (err) {
				should.not.exist(err);
				obj.raw.should.eql(raw);
				obj.hash.should.eql(expectHash);

				done();
			});
		});
	});

});