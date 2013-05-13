/**
 * User: jo
 * Date: 29.04.13
 * Time: 14:06
 *
 */

var HTTPParser = process.binding('http_parser').HTTPParser,
	FreeList = require('freelist').FreeList;

// Copy from nodejs source https://github.com/joyent/node/blob/master/lib/_http_common.js
var parsers = new FreeList('parsers', 10, function() {
	var parser = new HTTPParser(HTTPParser.REQUEST);
	// Only called in the slow case where slow means
	// that the request headers were either fragmented
	// across multiple TCP packets or too large to be
	// processed in a single run. This method is also
	// called to process trailing HTTP headers.
	return parser;
});


module.exports = function alloc(fn) {
	var parser = parsers.alloc();

	function onMessageComplete() {
		parsers.free(parser);
		fn();
	}

	parser.onMessageComplete = onMessageComplete;
	return parser;
};