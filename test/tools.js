/**
 * User: jo
 * Date: 13.05.13
 * Time: 16:55
 *
 * Testing tools.js
 */

var tools = require('../lib/tools.js'),
	crypto = require('crypto');


/**
 * Test for tools
 */
describe('tools', function () {

	/**
	 * Test for getHash
	 */
	describe('#getHash', function () {
		var str = 'adfasfasfaf';

		it('should be a md5 hash and return "hex"', function () {
			var h1 = crypto.createHash('md5'),
				h2 = tools.getHash();

			h1 = h1.update(str).digest('hex');
			h2 = h2.update(str).end();

			h1.should.eql(h2);
		});

	});

	/**
	 * Test for #getEndHeaderIndex
	 */
	describe('#getEndHeaderIndex', function () {
		var raw = new Buffer('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n'),
			last = raw.length - 4;

		it('should return ' + last, function () {
			var index = tools.getEndHeaderIndex(raw);
			index.should.eql(last);
		});
	});
});
