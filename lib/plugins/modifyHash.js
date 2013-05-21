/**
 * User: jo
 * Date: 21.05.13
 * Time: 18:15
 *
 */

var url = require('url'),
	async = require('async'),
	tools = require('../tools'),
	getHash = tools.getHash,
	getEndHadersIndex = tools.getEndHeaderIndex;

module.exports = function makeModifyHash(modFuncArr) {
	return function modifyHash(obj, next) {
		var raw = obj.raw,
			index = getEndHadersIndex(raw),
			head = parseHead(raw.slice(0, index));

		head._raw = raw;
		head._hash = obj.hash;
		head.body = raw.slice(index + 4);

		async.applyEachSeries(modFuncArr, head, function () {
			var newHead = makeHead(head),
				hash = tools.getHash()
							.update(newHead)
							.update(head.body)
							.end();

			obj.hash = hash;
			next();
		});
	};
};


function parseHead(buff) {
	var lns = buff.toString('utf8').split(/\r\n/),
		first = lns[0].split(' '),
		version,
		urlObj = url.parse(first[1], true),
		headers = {};

	for (var i = 1, l = lns.length; l > i; i += 1) {
		var ln = lns[i].match(/^([\w-]+): (.*)$/);
		if (!ln) continue;

		headers[ln[1]] = ln[2];
	}

	if (first[2]) {
		version = first[2].split('/')[1];
	}



	return {
		method: first[0],
		uri: {
			pathname: urlObj.pathname,
			query: urlObj.query
		},
		version: version,
		headers: headers
	};
}

function makeHead(obj) {
	var headers = obj.headers,
		arr = [
			obj.method.toUpperCase() + ' ' + url.format(obj.uri) + (obj.version ? ' HTTP/' + obj.version: '')
		];

	for (var name in headers) {
		arr.push(name + ': ' + headers[name]);
	}

	arr.push('\r\n');
	return new Buffer(arr.join('\r\n'));
}
