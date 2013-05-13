/**
 * User: jo
 * Date: 25.04.13
 * Time: 15:05
 *
 */

var http = require('http'),
	fs = require('fs'),
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

		it('should have "listen" method', function () {
			proxy.should.have.property('listen');
		});

		it('should have "reset" method', function () {
			proxy.should.have.property('reset');
		});

		it('should have "plugin" method', function () {
			proxy.should.have.property('plugin');
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
			function makeReq(done) {
				return function () {
					req
						.get('localhost:' + LOCAL_PROXY_PORT)
						.end(function (err, res) {
							should.not.exist(err);
							should.exist(res);
							res.ok.should.be.ok;

							res.text.should.be.eql('Hello');
							requestCount.should.be.eql(1);
							done();
						});
				}
			}

			makeReq(makeReq(done))();
		});
	});

	/**
	 * Test for #reset
	 */
	describe('#reset', function () {
		var proxy = new ProxyServer({
				cachedir: CACHE_DIR
			});

		var hidden = path.join(proxy.cachedir, '.hidden'),
			other = path.join(proxy.cachedir, 'blabla');

		before(function () {
			fs.writeFileSync(hidden, 'hello');
			fs.writeFileSync(other, 'hello');
		});

		after(function () {
			if (fs.existsSync(hidden)) fs.unlinkSync(hidden);
			if (fs.existsSync(other)) fs.unlinkSync(other);
		});

		it('should remove all file on cache dir expect hidden', function () {
			proxy.reset();
			fs.existsSync(hidden).should.be.ok;
			fs.existsSync(other).should.be.not.ok;
		});
	});


	/**
	 * Test for plugin
	 */
	describe('#plugin', function () {
		var server = http.createServer(function (req, res) {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('Hello');
			});

		var proxy = new ProxyServer({
				dest: { port: LOCAL_HTTP_PORT },
				localport: LOCAL_PROXY_PORT,
				cachedir: CACHE_DIR
			});

		before(function (done) {
			proxy.listen(function () {
				server.listen(LOCAL_HTTP_PORT, done);
			});
		});

		beforeEach(function () {
			proxy.reset();
		});

		after(function (done) {
			proxy.close(function () {
				server.close(done);
			});
		});;

		it('should be add function in "__plugins["onRequestComplete"]"', function () {
			function onRequestComplete(data, next) { next(); };

			proxy.plugin('onRequestComplete', onRequestComplete);
			proxy.__plugins["onRequestComplete"].should.include(onRequestComplete);
		});

		it('should call plugin function', function (done) {
			var isCall = false;

			function foo(data, next) {
				isCall = true;
				next();
			}
			proxy.plugin('onRequestComplete', foo);

			req
				.get('localhost:' + LOCAL_PROXY_PORT)
				.end(function (err, res) {
					should.not.exist(err);
					isCall.should.be.ok;
					done();
				});
		});

	});
});