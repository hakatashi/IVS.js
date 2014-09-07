REPORTER = nyan
DATA = data/ivd.json

$(DATA):
	node build.js

build: $(DATA)

test: build
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER)
