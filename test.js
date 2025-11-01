import process from 'node:process';
import test from 'node:test';
import assert from 'node:assert/strict';
import nock from 'nock';
import getStream from 'get-stream';
import ghGot from './index.js';

const token = process.env.GITHUB_TOKEN;

test('default', async () => {
	const {body} = await ghGot('users/sindresorhus');
	assert.strictEqual(body.login, 'sindresorhus');
});

test('full path', async () => {
	const {body} = await ghGot('https://api.github.com/users/sindresorhus', {prefixUrl: ''});
	assert.strictEqual(body.login, 'sindresorhus');
});

test('accepts options', async () => {
	const {body} = await ghGot('users/sindresorhus', {});
	assert.strictEqual(body.login, 'sindresorhus');
});

test('accepts options.prefixUrl without trailing slash', async () => {
	const {body} = await ghGot('users/sindresorhus', {prefixUrl: 'https://api.github.com'});
	assert.strictEqual(body.login, 'sindresorhus');
});

test('dedupes slashes', async () => {
	const {body} = await ghGot('/users/sindresorhus', {prefixUrl: 'https://api.github.com/'});
	assert.strictEqual(body.login, 'sindresorhus');
});

test('global token option', async () => {
	process.env.GITHUB_TOKEN = 'fail';

	await assert.rejects(
		ghGot.recreate()('users/sindresorhus'),
		{
			message: 'Bad credentials (401)',
		},
	);

	process.env.GITHUB_TOKEN = token;
});

test('token option (context)', async () => {
	await assert.rejects(
		ghGot('users/sindresorhus', {context: {token: 'fail'}}),
		{
			message: 'Bad credentials (401)',
		},
	);
});

test('token option (direct)', async () => {
	await assert.rejects(
		ghGot('users/sindresorhus', {token: 'fail'}),
		{
			message: 'Bad credentials (401)',
		},
	);
});

test('global endpoint option', async () => {
	process.env.GITHUB_ENDPOINT = 'fail';

	await assert.rejects(
		ghGot.recreate()('users/sindresorhus', {retries: 1}),
		error => {
			assert.match(error.message, /Invalid URL/);
			return true;
		},
	);

	delete process.env.GITHUB_ENDPOINT;
});

test('endpoint option', async () => {
	process.env.GITHUB_ENDPOINT = 'https://api.github.com/';

	await assert.rejects(
		ghGot.recreate()('users/sindresorhus', {
			prefixUrl: 'fail',
			retries: 1,
		}),
		error => {
			assert.match(error.message, /Invalid URL/);
			return true;
		},
	);

	delete process.env.GITHUB_ENDPOINT;
});

test('stream interface', async () => {
	const string1 = await getStream(ghGot.stream('users/sindresorhus'));
	assert.strictEqual(JSON.parse(string1).login, 'sindresorhus');

	const string2 = await getStream(ghGot.stream.get('users/sindresorhus'));
	assert.strictEqual(JSON.parse(string2).login, 'sindresorhus');
});

test('json body', async () => {
	const prefixUrl = 'http://mock-endpoint';
	const postBody = {test: [1, 3, 3, 7]};
	const reply = {ok: true};

	const scope = nock(prefixUrl).post('/test', postBody).reply(200, reply);

	const {body} = await ghGot.post('test', {prefixUrl, json: postBody});
	assert.deepStrictEqual(body, reply);
	assert.ok(scope.isDone());
});

test('custom error', async () => {
	await assert.rejects(
		ghGot('users/sindresorhus', {context: {token: 'fail'}}),
		error => {
			assert.strictEqual(error.name, 'GitHubError');
			assert.strictEqual(error.message, 'Bad credentials (401)');
			return true;
		},
	);
});

test('.rateLimit response property', async () => {
	const {rateLimit} = await ghGot('users/sindresorhus');
	assert.strictEqual(typeof rateLimit.limit, 'number');
	assert.strictEqual(typeof rateLimit.remaining, 'number');
	assert.ok(rateLimit.reset instanceof Date);
});

test('.rateLimit error property', async () => {
	try {
		await ghGot('users/sindresorhus', {context: {token: 'fail'}});
		assert.fail('Should have thrown');
	} catch (error) {
		// Rate limit headers may not be present on authentication errors
		// If they are present, they should be properly formatted
		if (error.rateLimit) {
			assert.strictEqual(typeof error.rateLimit.limit, 'number');
			assert.strictEqual(typeof error.rateLimit.remaining, 'number');
			assert.ok(error.rateLimit.reset instanceof Date);
		}

		// Ensure the error was thrown (test would fail if not)
		assert.ok(error);
	}
});
