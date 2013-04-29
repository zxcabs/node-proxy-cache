/**
 * User: jo
 * Date: 25.04.13
 * Time: 15:05
 *
 */

var http = require('http'),
	path =require('path'),
	should = require('should'),
	req = require('superagent'),
	ProxyServer = require('../lib/ProxyServer.js');

var LOCAL_PROXY_PORT = 9999;
var LOCAL_HTTP_PORT = 9998;
var CACHE_DIR = 'test/cachedir';

/**
 * Test for ProxyServer
 */
describe('ProxyServer', function () {
	/**
	 * Test for constructor
	 */
	describe('Constructor', function () {
		var proxy, dest;

		dest = { host: 'www.google.ru' };

		proxy = new ProxyServer({
			dest: dest,
			localport: LOCAL_PROXY_PORT,
			cachedir: CACHE_DIR
		});

		it('should have dest = "' + dest + '"', function () {
			proxy.should.have.property('dest');
			proxy.dest.should.have.property('host', dest.host);
			proxy.dest.should.have.property('port', 80);
		});

		it('should have localport = ' + LOCAL_PROXY_PORT, function () {
			proxy.should.have.property('localport', LOCAL_PROXY_PORT);
		});

		it('should have cachedir, and it should be resolved', function () {
			proxy.should.have.property('cachedir', path.resolve(CACHE_DIR));
		});

		it('should have "close" method', function () {
			proxy.should.have.property('close');
		});
	});

	/**
	 * Test for proxy
	 */
	describe('proxy', function () {
		var server, requestCount, proxy;

		requestCount = 0;
		server = http.createServer(function (req, res) {
			requestCount += 1;
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('Hello');
		});

		proxy = new ProxyServer({
			dest: { port: LOCAL_HTTP_PORT },
			localport: LOCAL_PROXY_PORT,
			cachedir: CACHE_DIR
		});

		before(function (done) {
			proxy.listen(function () {
				server.listen(LOCAL_HTTP_PORT, done);
			});
		});

		after(function (done) {
			proxy.close(function () {
				server.close(done);
			});
		});

		beforeEach(function () {
			proxy.reset();
			requestCount = 0;
		});


		it('should proxied request', function (done) {
			function makeReq(fn) {
				return function () {
					req
						.get('localhost:' + LOCAL_PROXY_PORT)
						.end(function (err, res) {
							should.not.exist(err);
							should.exist(res);
							res.ok.should.be.ok;

							res.text.should.be.eql('Hello');
							requestCount.should.be.eql(1);
							fn();
						});
				}
			}

			makeReq(makeReq(done))();
		});
	});
});