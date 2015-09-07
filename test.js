'use strict';
var test = require('ava');
var ghGot = require('./');

test('default', function (t) {
	t.plan(1);

	ghGot('users/sindresorhus')
	.then(function (res) {
		t.assert(res.body.login === 'sindresorhus');
	});
});

test('should accept options', function (t) {
	t.plan(1);

	ghGot('users/sindresorhus', {})
	.then(function (res) {
		t.assert(res.body.login === 'sindresorhus');
	});
});

test('token option', function (t) {
	t.plan(1);

	ghGot('users/sindresorhus', {token: 'fail'})
	.catch(function (err) {
		t.assert(err, err);
	});
});

test('endpoint option', function (t) {
	t.plan(1);

	ghGot('users/sindresorhus', {endpoint: 'fail'})
	.catch(function (err) {
		t.assert(err, err);
	});
});
