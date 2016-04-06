import test from 'ava';
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

test.serial('token option', async t => {
	process.env.GITHUB_TOKEN = 'fail';
	await t.throws(m('users/sindresorhus'), 'Response code 401 (Unauthorized)');
	process.env.GITHUB_TOKEN = token;
});

test('endpoint option', async t => {
	await t.throws(m('users/sindresorhus', {endpoint: 'fail', retries: 1}), /ENOTFOUND/);
});

test('stream interface', async t => {
	t.is(JSON.parse(await getStream(m.stream('users/sindresorhus'))).login, 'sindresorhus');
	t.is(JSON.parse(await getStream(m.stream.get('users/sindresorhus'))).login, 'sindresorhus');
});
