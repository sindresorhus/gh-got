import process from 'node:process';
import got from 'got';

const getRateLimit = headers => ({
	limit: Number.parseInt(headers['x-ratelimit-limit'], 10),
	remaining: Number.parseInt(headers['x-ratelimit-remaining'], 10),
	reset: new Date(Number.parseInt(headers['x-ratelimit-reset'], 10) * 1000),
});

const create = () => got.extend({
	prefixUrl: process.env.GITHUB_ENDPOINT || 'https://api.github.com',
	headers: {
		accept: 'application/vnd.github.v3+json',
		'user-agent': 'https://github.com/sindresorhus/gh-got',
	},
	responseType: 'json',
	context: {
		token: process.env.GITHUB_TOKEN,
	},
	hooks: {
		init: [
			(raw, options) => {
				// TODO: This should be fixed in Got.
				// TODO: This doesn't seem to have any effect.
				if (typeof options.url === 'string' && options.url.startsWith('/')) {
					options.url = options.url.slice(1);
				}

				if ('token' in raw) {
					options.context.token = raw.token;
					delete raw.token;
				}
			},
		],
	},
	handlers: [
		(options, next) => {
			// TODO: This should be fixed in Got
			// TODO: This doesn't seem to have any effect.
			if (typeof options.url === 'string' && options.url.startsWith('/')) {
				options.url = options.url.slice(1);
			}

			// Authorization
			const {token} = options.context;
			if (token && !options.headers.authorization) {
				options.headers.authorization = `token ${token}`;
			}

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
						error.message = `${response.body.message} (${response.statusCode})`;
					}

					// Rate limit for errors
					if (response) {
						error.rateLimit = getRateLimit(response.headers);
					}

					throw error;
				}
			})();
		},
	],
});

const ghGot = create();

export default ghGot;

if (process.env.NODE_ENV === 'test') {
	ghGot.recreate = create;
}
