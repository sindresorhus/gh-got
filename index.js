'use strict';
const got = require('got');

function ghGot(path, opts) {
	if (typeof path !== 'string') {
		return Promise.reject(new TypeError(`Expected 'path' to be a string, got ${typeof path}`));
	}

	opts = Object.assign({json: true, endpoint: 'https://api.github.com/'}, opts);

	opts.headers = Object.assign({
		'accept': 'application/vnd.github.v3+json',
		'user-agent': 'https://github.com/sindresorhus/gh-got'
	}, opts.headers);

	const env = process.env;
	const token = env.GITHUB_TOKEN || opts.token;

	if (token) {
		opts.headers.authorization = `token ${token}`;
	}

	// https://developer.github.com/v3/#http-verbs
	if (opts.method && opts.method.toLowerCase() === 'put' && !opts.body) {
		opts.headers['content-length'] = 0;
	}

	const endpoint = env.GITHUB_ENDPOINT ? env.GITHUB_ENDPOINT.replace(/[^/]$/, '$&/') : opts.endpoint;
	const url = /https?/.test(path) ? path : endpoint + path;

	if (opts.stream) {
		return got.stream(url, opts);
	}

	return got(url, opts);
}

const helpers = [
	'get',
	'post',
	'put',
	'patch',
	'head',
	'delete'
];

ghGot.stream = (url, opts) => ghGot(url, Object.assign({}, opts, {json: false, stream: true}));

for (const x of helpers) {
	const method = x.toUpperCase();
	ghGot[x] = (url, opts) => ghGot(url, Object.assign({}, opts, {method}));
	ghGot.stream[x] = (url, opts) => ghGot.stream(url, Object.assign({}, opts, {method}));
}

module.exports = ghGot;
