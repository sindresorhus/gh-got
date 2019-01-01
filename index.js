'use strict';
const got = require('got');

const getRateLimit = ({headers}) => ({
	limit: parseInt(headers['x-ratelimit-limit'], 10),
	remaining: parseInt(headers['x-ratelimit-remaining'], 10),
	reset: new Date(parseInt(headers['x-ratelimit-reset'], 10) * 1000)
});

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
			options.headers.authorization = options.headers.authorization || `token ${options.token}`;
		}

		if (options.stream) {
			return next(options);
		}

		// TODO: Use async/await here when Got supports the `handler` being an async function
		return next(options)
			.then(response => { // eslint-disable-line promise/prefer-await-to-then
				response.rateLimit = getRateLimit(response);
				return response;
			})
			.catch(error => {
				const {response} = error;

				if (response && response.body) {
					error.name = 'GitHubError';
					error.message = `${response.body.message} (${error.statusCode})`;
				}

				if (response) {
					error.rateLimit = getRateLimit(response);
				}

				throw error;
			});
	}
});

module.exports = create();

if (process.env.NODE_ENV === 'test') {
	module.exports.recreate = create;
}
