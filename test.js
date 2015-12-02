import test from 'ava';
import getStream from 'get-stream';
import fn from './';

global.Promise = Promise;

const token = process.env.GITHUB_TOKEN;

test('default', async t => {
	t.is((await fn('users/sindresorhus')).body.login, 'sindresorhus');
});

test('should accept options', async t => {
	t.is((await fn('users/sindresorhus', {})).body.login, 'sindresorhus');
});

test.serial('token option', async t => {
	process.env.GITHUB_TOKEN = 'fail';
	await t.throws(fn('users/sindresorhus'), 'Response code 401 (Unauthorized)');
	process.env.GITHUB_TOKEN = token;
});

test('endpoint option', async t => {
	await t.throws(fn('users/sindresorhus', {endpoint: 'fail', retries: 1}), /ENOTFOUND/);
});

test('stream interface', async t => {
	t.is(JSON.parse(await getStream(fn.stream('users/sindresorhus'))).login, 'sindresorhus');
	t.is(JSON.parse(await getStream(fn.stream.get('users/sindresorhus'))).login, 'sindresorhus');
});
