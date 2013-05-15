/**
 * User: jo
 * Date: 13.05.13
 * Time: 16:46
 *
 */

var crypto = require('crypto');

function MD5() {
	this.__hash = crypto.createHash('md5');
}

MD5.prototype.update = function update(chunk) {
	this.__hash.update(chunk);
	return this;
};

MD5.prototype.end = function end() {
	return this.__hash.digest('hex');
};

/**
 * Return hash function
 *
 * @return {MD5} object
 */
exports.getHash = function getHash() {
	return new MD5();
};


var R = 13, // \r
	N = 10; // \n
/**
 * Return last header index from buffer
 *
 * @param {Buffer} buff Raw data
 * @return {Integer} Index
 */
exports.getEndHeaderIndex = function getEndHeaderIndex(buff) {
	var i, l;

	for (i = 0, l = buff.length - 4; l > i; i += 1) {
		if (buff[i] === R && buff[i + 4] === N) break;
	}

	return i;
};