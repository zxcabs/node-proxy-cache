MOCHA = ./node_modules/.bin/mocha

test:
	@NODE_ENV=test $(MOCHA) \
	-r should \
	-R spec

test-proxy-server:
	@NODE_ENV=test $(MOCHA) \
	./test/proxyServer.js \
	-r should \
	-R spec

test-tools:
	@NODE_ENV=test $(MOCHA) \
	./test/tools.js \
	-r should \
	-R spec

test-plugins:
	@NODE_ENV=test $(MOCHA) \
	./test/plugins.js \
	-r should \
	-R spec

.PHONY: test test-proxy-server test-tools test-plugins