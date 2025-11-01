import process from 'node:process';
import got from 'got';

const getRateLimit = headers => {
	const limit = headers['x-ratelimit-limit'];
	const remaining = headers['x-ratelimit-remaining'];
	const reset = headers['x-ratelimit-reset'];

	if (limit === undefined || remaining === undefined || reset === undefined) {
		return undefined;
	}

	return {
		limit: Number.parseInt(limit, 10),
		remaining: Number.parseInt(remaining, 10),
		reset: new Date(Number.parseInt(reset, 10) * 1000),
	};
};

const create = () => {
	const gotInstance = got.extend({
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
					if ('token' in raw) {
						options.context.token = raw.token;
						delete raw.token;
					}
				},
			],
		},
		handlers: [
			(options, next) => {
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
						const rateLimit = getRateLimit(response.headers);
						if (rateLimit) {
							response.rateLimit = rateLimit;
						}

						return response;
					} catch (error) {
						const {response} = error;

						// Nicer errors
						if (response?.body?.message) {
							error.name = 'GitHubError';
							error.message = `${response.body.message} (${response.statusCode})`;
						}

						// Rate limit for errors
						if (response) {
							const rateLimit = getRateLimit(response.headers);
							if (rateLimit) {
								error.rateLimit = rateLimit;
							}
						}

						throw error;
					}
				})();
			},
		],
	});

	// Use Proxy to handle leading slashes - Got v14+ throws error if URL starts with '/' when using prefixUrl
	// This approach is cleaner than copying properties and automatically handles all methods
	return new Proxy(gotInstance, {
		apply(target, thisArg, argumentsList) {
			let [url, options] = argumentsList;

			// Handle string URL with leading slash
			if (typeof url === 'string' && url.startsWith('/')) {
				url = url.slice(1);
			}

			// Handle options object with url property that has leading slash
			if (typeof url === 'object' && url !== null && typeof url.url === 'string' && url.url.startsWith('/')) {
				url = {...url, url: url.url.slice(1)};
			}

			return Reflect.apply(target, thisArg, [url, options]);
		},
	});
};

const ghGot = create();

export default ghGot;

if (process.env.NODE_ENV === 'test') {
	ghGot.recreate = create;
}
