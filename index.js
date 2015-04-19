'use strict';
var got = require('got');
var objectAssign = require('object-assign');

function ghGot(path, opts, cb) {
	if (!path) {
		throw new Error('path required');
	}

	if (typeof opts !== 'object') {
		cb = opts;
		opts = {};
	}

	cb = cb || function () {};
	opts = objectAssign({}, opts, {json: true});

	opts.headers = objectAssign({
		'accept': 'application/vnd.github.v3+json',
		'content-length': 0,
		'user-agent': 'https://github.com/sindresorhus/gh-got'
	}, opts.headers);

	var env = process.env;
	var token = env.GITHUB_TOKEN || opts.token;

	if (token) {
		opts.headers['authorization'] = 'token ' + token;
	}

	var endpoint = env.GITHUB_ENDPOINT ? env.GITHUB_ENDPOINT.replace(/[^/]$/, '$&/') : opts.endpoint;
	var url = (endpoint ? endpoint : 'https://api.github.com/') + path;

	return got(url, opts, cb);
};

[
	'get',
	'post',
	'put',
	'patch',
	'head',
	'delete'
].forEach(function (el) {
	ghGot[el] = function (url, opts, cb) {
		return ghGot(url, objectAssign({}, opts, {method: el.toUpperCase()}), cb);
	};
});

module.exports = ghGot;
