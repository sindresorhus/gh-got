const test = require('ava');
const nock = require('nock');
const getStream = require('get-stream');
const ghGot = require('.');

const token = process.env.GITHUB_TOKEN;

test('default', async t => {
	t.is((await ghGot('users/sindresorhus')).body.login, 'sindresorhus');
});

test('full path', async t => {
	t.is((await ghGot('https://api.github.com/users/sindresorhus', {prefixUrl: ''})).body.login, 'sindresorhus');
});

test('accepts options', async t => {
	t.is((await ghGot('users/sindresorhus', {})).body.login, 'sindresorhus');
});

test('accepts options.prefixUrl without trailing slash', async t => {
	t.is((await ghGot('users/sindresorhus', {prefixUrl: 'https://api.github.com'})).body.login, 'sindresorhus');
});

test('dedupes slashes', async t => {
	t.is((await ghGot('/users/sindresorhus', {prefixUrl: 'https://api.github.com/'})).body.login, 'sindresorhus');
});

test.serial('global token option', async t => {
	process.env.GITHUB_TOKEN = 'fail';
	await t.throwsAsync(
		ghGot.recreate()('users/sindresorhus'),
		{
			message: 'Bad credentials (401)'
		}
	);
	process.env.GITHUB_TOKEN = token;
});

test('token option', async t => {
	await t.throwsAsync(ghGot('users/sindresorhus', {token: 'fail'}), {
		message: 'Bad credentials (401)'
	});
});

test.serial('global endpoint option', async t => {
	process.env.GITHUB_ENDPOINT = 'fail';
	await t.throwsAsync(ghGot.recreate()('users/sindresorhus', {retries: 1}), {
		message: 'Invalid URL: fail/users/sindresorhus'
	});
	delete process.env.GITHUB_ENDPOINT;
});

test.serial('endpoint option', async t => {
	process.env.GITHUB_ENDPOINT = 'https://api.github.com/';
	await t.throwsAsync(ghGot.recreate()('users/sindresorhus', {
		prefixUrl: 'fail',
		retries: 1
	}), {
		message: 'Invalid URL: fail/users/sindresorhus'
	});
	delete process.env.GITHUB_ENDPOINT;
});

test('stream interface', async t => {
	t.is(JSON.parse(await getStream(ghGot.stream('users/sindresorhus'))).login, 'sindresorhus');
	t.is(JSON.parse(await getStream(ghGot.stream.get('users/sindresorhus'))).login, 'sindresorhus');
});

test('json body', async t => {
	const prefixUrl = 'http://mock-endpoint';
	const body = {test: [1, 3, 3, 7]};
	const reply = {ok: true};

	const scope = nock(prefixUrl).post('/test', body).reply(200, reply);

	t.deepEqual((await ghGot.post('test', {prefixUrl, body})).body, reply);
	t.truthy(scope.isDone());
});

test('custom error', async t => {
	await t.throwsAsync(ghGot('users/sindresorhus', {token: 'fail'}), {
		name: 'GitHubError',
		message: 'Bad credentials (401)'
	});
});

test('.rateLimit response property', async t => {
	const {rateLimit} = await ghGot('users/sindresorhus');
	t.is(typeof rateLimit.limit, 'number');
	t.is(typeof rateLimit.remaining, 'number');
	t.true(rateLimit.reset instanceof Date);
});

test('.rateLimit error property', async t => {
	const {rateLimit} = await t.throwsAsync(ghGot('users/sindresorhus', {token: 'fail'}));
	t.is(typeof rateLimit.limit, 'number');
	t.is(typeof rateLimit.remaining, 'number');
	t.true(rateLimit.reset instanceof Date);
});
