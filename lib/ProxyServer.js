/**
 * User: jo
 * Date: 25.04.13
 * Time: 15:15
 *
 */

var http = require('http'),
	net = require('net'),
	path = require('path'),
	crypto = require('crypto'),
	parsers = require('./parsers.js'),
	fs = require('fs');



function ProxyServer(opt) {
	this.dest;
	this.localport = opt.localport;
	this.cachedir = path.resolve(opt.cachedir);
	this.clientTimeout = opt.clientTimeout || 15 * 1000;

	if (opt.dest) {
		this.dest = {};
		this.dest.host = opt.dest.host || 'localhost';
		this.dest.port = opt.dest.port || 80;
	} else {
		this.dest = {
			host: 'localhost',
			port: 80
		};
	}

	this.__serv = net.createServer(this.__requestListener.bind(this));
}

ProxyServer.prototype.__requestListener = function __requestListener(client) {
	var self = this,
		parser = parsers(onMessageComplete),
		md5 = crypto.createHash('md5'),
		chunks = [];

	function clear() {
		client.removeListener('data', onClientData);
	}

	function onMessageComplete  () {
		clear();
		self.__send(client, Buffer.concat(chunks), md5.digest('hex'));
	}

	function onClientData(chunk) {
		process.nextTick(function () {
			parser.execute(chunk, 0, chunk.length);
		});
		md5.update(chunk);
		chunks.push(chunk);
	}

	client.on('data',onClientData);
};

ProxyServer.prototype.__send = function __send(client, data, hash) {
	var self = this,
		filepath = path.join(self.cachedir, hash),
		dest;

	if (fs.existsSync(filepath)) {
		var rs = fs.createReadStream(filepath);
		rs.pipe(client);
	} else {
		dest = net.connect(self.dest, function onConnect() {
			var ws = fs.createWriteStream(filepath);

			dest.pipe(ws);
			dest.pipe(client);
			dest.end(data);
		});
	}
};

ProxyServer.prototype.listen = function listen(fn) {
	return this.__serv.listen(this.localport, fn);
};

ProxyServer.prototype.close = function close(fn) {
	return this.__serv.close(fn);
};

ProxyServer.prototype.reset = function reset() {
	var cachedir = this.cachedir,
		list = fs.readdirSync(cachedir);

	for (var i = 0, l = list.length; l > i; i += 1) {
		var filepath = path.join(cachedir, list[i]);
		fs.unlinkSync(filepath);
	}
};

module.exports = ProxyServer;