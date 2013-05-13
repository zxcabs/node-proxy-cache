/**
 * User: jo
 * Date: 13.05.13
 * Time: 16:40
 *
 * Plugin for replacing query params in hash
 * doesn't change request data
 */

var url = require('url'),
	tools = require('../tools.js');

/**
 * replacing query params in hash
 *
 * @param {Object} obj Income object, consist with data and hash
 * @param {Function} next Go to next
 */
module.exports = function makePlugin(param) {
	return function replaceParamsInHash(obj, next) {
		var raw = obj.raw,
			index = getFirstStringIndex(raw),
			firstStr = raw.slice(0, index).toString('utf8'),
			arr = firstStr.split(' '),
			urlObj = url.parse(arr[1], true),
			query = urlObj.query;

		for (var key in param) {
			query[key] = param[key];
		}

		arr[1] = url.format({
			pathname: urlObj.pathname,
			query: query
		});

		obj.hash = tools.getHash()
			//add new first line
			.update(arr.join(' '))
			//add last raw data
			.update(raw.slice(index))
			.end();

		next();
	}
};

var R = 13; // \r
function getFirstStringIndex(buffer) {
	var i = 3,
		l = buffer.length;

	while (R !== buffer[i] && l > i) {
		i += 1;
	}

	return i;
}