'use strict';
const got = require('got');

const getRateLimit = headers => ({
	limit: parseInt(headers['x-ratelimit-limit'], 10),
	remaining: parseInt(headers['x-ratelimit-remaining'], 10),
	reset: new Date(parseInt(headers['x-ratelimit-reset'], 10) * 1000)
});

const create = () => got.extend({
	prefixUrl: process.env.GITHUB_ENDPOINT || 'https://api.github.com',
	headers: {
		accept: 'application/vnd.github.v3+json',
		'user-agent': 'https://github.com/sindresorhus/gh-got'
	},
	responseType: 'json',
	token: process.env.GITHUB_TOKEN,
	handlers: [
		(options, next) => {
			// Authorization
			if (options.token && !options.headers.authorization) {
				options.headers.authorization = `token ${options.token}`;
			}

			// `options.body` -> `options.json`
			options.json = options.body;
			delete options.body;

			// Don't touch streams
			if (options.isStream) {
				return next(options);
			}

			// Magic begins
			return (async () => {
				try {
					const response = await next(options);

					// Rate limit for the Response object
					response.rateLimit = getRateLimit(response.headers);

					return response;
				} catch (error) {
					const {response} = error;

					// Nicer errors
					if (response && response.body) {
						error.name = 'GitHubError';
						error.message = `${response.body.message} (${error.response.statusCode})`;
					}

					// Rate limit for errors
					if (response) {
						error.rateLimit = getRateLimit(response.headers);
					}

					throw error;
				}
			})();
		}
	],
	hooks: {
		init: [
			options => {
				// TODO: This should be fixed in Got
				// Remove leading slashes
				if (typeof options.url === 'string' && options.url.startsWith('/')) {
					options.url = options.url.slice(1);
				}
			}
		]
	}
});

module.exports = create();

if (process.env.NODE_ENV === 'test') {
	module.exports.recreate = create;
}
