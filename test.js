import test from 'ava';
import getStream from 'get-stream';
import fn from './';

test('default', async t => {
	t.is((await fn('users/sindresorhus')).body.login, 'sindresorhus');
});

test('should accept options', async t => {
	t.is((await fn('users/sindresorhus', {})).body.login, 'sindresorhus');
});

test('token option', t => {
	// TODO: use `t.throws` when it supports promises
	return fn('users/sindresorhus', {token: 'fail'}).catch(err => t.ok(err));
});

test('endpoint option', t => {
	// TODO: use `t.throws` when it supports promises
	return fn('users/sindresorhus', {endpoint: 'fail'}).catch(err => t.ok(err));
});

test('stream interface', async t => {
	t.is(JSON.parse(await getStream(fn.stream('users/sindresorhus'))).login, 'sindresorhus');
	t.is(JSON.parse(await getStream(fn.stream.get('users/sindresorhus'))).login, 'sindresorhus');
});
