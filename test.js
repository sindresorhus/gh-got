import test from 'ava';
import nock from 'nock';
import getStream from 'get-stream';
import m from './';

const token = process.env.GITHUB_TOKEN;

test('default', async t => {
	t.is((await m('users/sindresorhus')).body.login, 'sindresorhus');
});

test('full path', async t => {
	t.is((await m('https://api.github.com/users/sindresorhus')).body.login, 'sindresorhus');
});

test('accepts options', async t => {
	t.is((await m('users/sindresorhus', {})).body.login, 'sindresorhus');
});

test.serial('global token option', async t => {
	process.env.GITHUB_TOKEN = 'fail';
	await t.throws(m('users/sindresorhus'), 'Response code 401 (Unauthorized)');
	process.env.GITHUB_TOKEN = token;
});

test('token option', t => {
	t.throws(m('users/sindresorhus', {token: 'fail'}), 'Response code 401 (Unauthorized)');
});

test.serial('global endpoint option', async t => {
	process.env.GITHUB_ENDPOINT = 'fail';
	await t.throws(m('users/sindresorhus', {retries: 1}), /ENOTFOUND/);
	delete process.env.GITHUB_ENDPOINT;
});

test.serial('endpoint option', async t => {
	process.env.GITHUB_ENDPOINT = 'https://api.github.com/';
	await t.throws(m('users/sindresorhus', {
		endpoint: 'fail',
		retries: 1
	}), /ENOTFOUND/);
	delete process.env.GITHUB_ENDPOINT;
});

test('stream interface', async t => {
	t.is(JSON.parse(await getStream(m.stream('users/sindresorhus'))).login, 'sindresorhus');
	t.is(JSON.parse(await getStream(m.stream.get('users/sindresorhus'))).login, 'sindresorhus');
});

test('json body', async t => {
	const endpoint = 'http://mock-endpoint';
	const body = {test: [1, 3, 3, 7]};
	const reply = {ok: true};

	const scope = nock(endpoint).post('/test', body).reply(200, reply);

	t.deepEqual((await m('/test', {endpoint, body})).body, reply);
	t.truthy(scope.isDone());
});
