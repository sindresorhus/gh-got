# gh-got

> Convenience wrapper for [Got](https://github.com/sindresorhus/got) to interact with the [GitHub API](https://developer.github.com/v3/)

Unless you're already using Got, you should probably use GitHub's own [@octokit/rest.js](https://github.com/octokit/rest.js) or [@octokit/graphql.js](https://github.com/octokit/graphql.js) packages instead.

## Install

```sh
npm install gh-got
```

## Usage

Instead of:

```js
import got from 'got';

const token = 'foo';

const {body} = await got('https://api.github.com/users/sindresorhus', {
	json: true,
	headers: {
		'accept': 'application/vnd.github.v3+json',
		'authorization': `token ${token}`
	}
});

console.log(body.login);
//=> 'sindresorhus'
```

You can do:

```js
import ghGot from 'gh-got';

const {body} = await ghGot('users/sindresorhus', {
	context: {
		token: 'foo'
	}
});

console.log(body.login);
//=> 'sindresorhus'
```

Or:

```js
import ghGot from 'gh-got';

const {body} = await ghGot('https://api.github.com/users/sindresorhus', {
	context: {
		token: 'foo'
	}
});

console.log(body.login);
//=> 'sindresorhus'
```

## API

Same API as [`got`](https://github.com/sindresorhus/got), including options, the stream API, aliases, pagination, etc, but with some additional options below.

Errors are improved by using the custom GitHub error messages. Doesn't apply to the stream API.

### `gh-got` specific options

#### token

Type: `string`

GitHub [access token](https://github.com/settings/tokens/new).

Can be set globally with the `GITHUB_TOKEN` environment variable.

#### prefixUrl

Type: `string`\
Default: `https://api.github.com/`

To support [GitHub Enterprise](https://enterprise.github.com).

Can be set globally with the `GITHUB_ENDPOINT` environment variable.

#### body

Type: `object`

Can be specified as a plain object and will be serialized as JSON with the appropriate headers set.

## Rate limit

Responses and errors have a `.rateLimit` property with info about the current [rate limit](https://developer.github.com/v3/#rate-limiting). *(This is not yet implemented for the stream API)*

```js
import ghGot from 'gh-got';

const {rateLimit} = await ghGot('users/sindresorhus');

console.log(rateLimit);
//=> {limit: 5000, remaining: 4899, reset: [Date 2018-12-31T20:45:20.000Z]}
```

## Authorization

Authorization for GitHub uses the following logic:

1. If `options.headers.authorization` is passed to `gh-got`, then this will be used as first preference.
2. If `options.token` is provided, then the `authorization` header will be set to `token <options.token>`.
3. If `options.headers.authorization` and `options.token` are not provided, then the `authorization` header will be set to `token <process.env.GITHUB_TOKEN>`

In most cases, this means you can simply set `GITHUB_TOKEN`, but it also allows it to be overridden by setting `options.token` or `options.headers.authorization` explicitly. For example, if [authenticating as a GitHub App](https://developer.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app), you could do the following:

```js
import ghGot from 'gh-got';

const options = {
	headers: {
		authorization: `Bearer ${jwt}`
	}
};
const {body} = await ghGot('app', options);

console.log(body.name);
//=> 'MyApp'
```

## Pagination

See the [Got docs](https://github.com/sindresorhus/got/blob/main/documentation/4-pagination.md).
