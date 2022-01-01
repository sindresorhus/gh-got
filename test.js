import process from 'node:process';
import test from 'ava';
import nock from 'nock';
import getStream from 'get-stream';
import ghGot from './index.js';

const token = process.env.GITHUB_TOKEN;

test('default', async t => {
	const {body} = await ghGot('users/sindresorhus');
	t.is(body.login, 'sindresorhus');
});

test('full path', async t => {
	const {body} = await ghGot('https://api.github.com/users/sindresorhus', {prefixUrl: ''});
	t.is(body.login, 'sindresorhus');
});

test('accepts options', async t => {
	const {body} = await ghGot('users/sindresorhus', {});
	t.is(body.login, 'sindresorhus');
});

test('accepts options.prefixUrl without trailing slash', async t => {
	const {body} = await ghGot('users/sindresorhus', {prefixUrl: 'https://api.github.com'});
	t.is(body.login, 'sindresorhus');
});

test.failing('dedupes slashes', async t => {
	const {body} = await ghGot('/users/sindresorhus', {prefixUrl: 'https://api.github.com/'});
	t.is(body.login, 'sindresorhus');
});

test.serial('global token option', async t => {
	process.env.GITHUB_TOKEN = 'fail';

	await t.throwsAsync(
		ghGot.recreate()('users/sindresorhus'),
		{
			message: 'Bad credentials (401)',
		},
	);

	process.env.GITHUB_TOKEN = token;
});

test('token option', async t => {
	await t.throwsAsync(ghGot('users/sindresorhus', {context: {token: 'fail'}}), {
		message: 'Bad credentials (401)',
	});
});

test.serial('global endpoint option', async t => {
	process.env.GITHUB_ENDPOINT = 'fail';

	await t.throwsAsync(ghGot.recreate()('users/sindresorhus', {retries: 1}), {
		message: /Invalid URL/,
	});

	delete process.env.GITHUB_ENDPOINT;
});

test.serial('endpoint option', async t => {
	process.env.GITHUB_ENDPOINT = 'https://api.github.com/';

	await t.throwsAsync(ghGot.recreate()('users/sindresorhus', {
		prefixUrl: 'fail',
		retries: 1,
	}), {
		message: /Invalid URL/,
	});

	delete process.env.GITHUB_ENDPOINT;
});

test('stream interface', async t => {
	const string1 = await getStream(ghGot.stream('users/sindresorhus'));
	t.is(JSON.parse(string1).login, 'sindresorhus');

	const string2 = await getStream(ghGot.stream.get('users/sindresorhus'));
	t.is(JSON.parse(string2).login, 'sindresorhus');
});

test('json body', async t => {
	const prefixUrl = 'http://mock-endpoint';
	const postBody = {test: [1, 3, 3, 7]};
	const reply = {ok: true};

	const scope = nock(prefixUrl).post('/test', postBody).reply(200, reply);

	const {body} = await ghGot.post('test', {prefixUrl, json: postBody});
	t.deepEqual(body, reply);
	t.truthy(scope.isDone());
});

test('custom error', async t => {
	await t.throwsAsync(ghGot('users/sindresorhus', {context: {token: 'fail'}}), {
		name: 'GitHubError',
		message: 'Bad credentials (401)',
	});
});

test('.rateLimit response property', async t => {
	const {rateLimit} = await ghGot('users/sindresorhus');
	t.is(typeof rateLimit.limit, 'number');
	t.is(typeof rateLimit.remaining, 'number');
	t.true(rateLimit.reset instanceof Date);
});

test('.rateLimit error property', async t => {
	const {rateLimit} = await t.throwsAsync(ghGot('users/sindresorhus', {context: {token: 'fail'}}));
	t.is(typeof rateLimit.limit, 'number');
	t.is(typeof rateLimit.remaining, 'number');
	t.true(rateLimit.reset instanceof Date);
});
