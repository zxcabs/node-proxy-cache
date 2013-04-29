MOCHA = ./node_modules/.bin/mocha

test:
	@NODE_ENV=test $(MOCHA) \
	-r should \
	-R spec

.PHONY: test