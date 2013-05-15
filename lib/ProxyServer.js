/**
 * User: jo
 * Date: 25.04.13
 * Time: 15:15
 *
 */

var http = require('http'),
	net = require('net'),
	path = require('path'),
	async = require('async'),
	parsers = require('./parsers.js'),
	tools = require('./tools.js'),
	fs = require('fs');



function ProxyServer(opt) {
	this.dest;
	this.localport = opt.localport;
	this.cachedir = path.resolve(opt.cachedir);
	this.clientTimeout = opt.clientTimeout || 15 * 1000;
	this.__plugins = {
			onRequestComplete: []
		};

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
		chunks = [];

	function clear() {
		client.removeListener('data', onClientData);
	}

	function onMessageComplete  () {
		var data,
			raw = Buffer.concat(chunks);

		raw = self.__addHost(raw);

		data = {
			raw: raw,
			hash: tools.getHash().update(raw).end()
		};

		clear();

		async.applyEachSeries(self.__plugins["onRequestComplete"], data, function () {
			self.__send(client, data.raw, data.hash);
		});
	}

	function onClientData(chunk) {
		chunks.push(chunk);
		parser.execute(chunk, 0, chunk.length);
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

/**
 * Plugin
 *
 * @param {String} name Plugin name. Enum: ["onRequestComplete"]
 * @param {Function} func Plugin function
 */
ProxyServer.prototype.plugin = function plugin(name, func) {
	var plugins = this.__plugins[name];

	if (!plugins || ~plugins.indexOf(func)) return false;
	plugins.push(func);
	return true;
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
		var filename = list[i];

		if (filename[0] === ".") continue;

		var filepath = path.join(cachedir, filename);
		fs.unlinkSync(filepath);
	}
};

ProxyServer.prototype.__addHost = function addHost(raw) {
	var index = tools.getEndHeaderIndex(raw),
		lns = raw.slice(0, index).toString('utf8').split('\r\n'),
		i, l;

	for (i = 1, l = lns.length; l > i; i += 1) {
		if (!/^Host:/.test(lns[i])) continue;
        lns[i] = 'Host: ' + this.dest.host + ':' + this.dest.port;
		break;
	}

	lns = lns.join('\r\n');
	raw = Buffer.concat([new Buffer(lns), raw.slice(index)]);

	return raw;
};

//plugins
ProxyServer.plugins = {
	replaceParamsInHash: require('./plugins/replaceParamsInHash.js')
};

module.exports = ProxyServer;