# gh-got [![Build Status](https://travis-ci.org/sindresorhus/gh-got.svg?branch=master)](https://travis-ci.org/sindresorhus/gh-got)

> Convenience wrapper for [`got`](https://github.com/sindresorhus/got) to interact with the [GitHub API](https://developer.github.com/v3/)


## Install

```
$ npm install gh-got
```


## Usage

Instead of:

```js
const got = require('got');
const token = 'foo';

(async () => {
	const {body} = await got('https://api.github.com/users/sindresorhus', {
		json: true,
		headers: {
			'accept': 'application/vnd.github.v3+json',
			'authorization': `token ${token}`
		}
	});

	console.log(body.login);
	//=> 'sindresorhus'
})();
```

You can do:

```js
const ghGot = require('gh-got');

(async () => {
	const {body} = await ghGot('users/sindresorhus', {token: 'foo'});

	console.log(body.login);
	//=> 'sindresorhus'
})();
```

Or:

```js
const ghGot = require('gh-got');

(async () => {
	const {body} = await ghGot('https://api.github.com/users/sindresorhus', {token: 'foo'});

	console.log(body.login);
	//=> 'sindresorhus'
})();
```


## API

Same API as [`got`](https://github.com/sindresorhus/got), including the stream API and aliases, but with some additional options below.

Errors are improved by using the custom GitHub error messages. Doesn't apply to the stream API.

### `gh-got` specific options

#### token

Type: `string`

GitHub [access token](https://github.com/settings/tokens/new).

Can be set globally with the `GITHUB_TOKEN` environment variable.

#### baseUrl

Type: `string`<br>
Default: `https://api.github.com/`

To support [GitHub Enterprise](https://enterprise.github.com).

Can be set globally with the `GITHUB_ENDPOINT` environment variable.

#### body

Type: `Object`

Can be specified as a plain object and will be serialized as JSON with the appropriate headers set.


## Rate limit

Responses and errors have a `.rateLimit` property with info about the current [rate limit](https://developer.github.com/v3/#rate-limiting). *(This is not yet implemented for the stream API)*

```js
const ghGot = require('gh-got');

(async () => {
	const {rateLimit} = await ghGot('users/sindresorhus');

	console.log(rateLimit);
	//=> {limit: 5000, remaining: 4899, reset: [Date 2018-12-31T20:45:20.000Z]}
})();
```


## Authorization

Authorization for GitHub uses the following logic:

1. If `options.headers.authorization` is passed to `gh-got`, then this will be used as first preference.
2. If `options.token` is provided, then the `authorization` header will be set to `token <options.token>`.
3. If `options.headers.authorization` and `options.token` are not provided, then the `authorization` header will be set to `token <process.env.GITHUB_TOKEN>`

In most cases, this means you can simply set `GITHUB_TOKEN`, but it also allows it to be overridden by setting `options.token` or `options.headers.authorization` explicitly. For example, if [authenticating as a GitHub App](https://developer.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app), you could do the following:

```js
const ghGot = require(`gh-got`);

(async () => {
	const options = {
		headers: {
			authorization: `Bearer ${jwt}`
		}
	};
	const {body} = await ghGot('app', options);

	console.log(body.name);
	//=> 'MyApp'
})();
```


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
