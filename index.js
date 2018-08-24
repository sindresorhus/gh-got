'use strict';
const got = require('got');

const create = () => got.create({
	options: got.mergeOptions(got.defaults.options, {
		json: true,
		token: process.env.GITHUB_TOKEN,
		baseUrl: process.env.GITHUB_ENDPOINT || 'https://api.github.com',
		headers: {
			accept: 'application/vnd.github.v3+json',
			'user-agent': 'https://github.com/sindresorhus/gh-got'
		}
	}),
	methods: got.defaults.methods,
	handler: (options, next) => {
		if (options.token) {
			options.headers.authorization = `token ${options.token}`;
		}

		if (options.stream) {
			return next(options);
		}

		return next(options).catch(err => {
			if (err.response && err.response.body) {
				err.name = 'GitHubError';
				err.message = `${err.response.body.message} (${err.statusCode})`;
			}

			throw err;
		});
	}
});

module.exports = create();

if (process.env.NODE_ENV === 'test') {
	module.exports.recreate = create;
}
