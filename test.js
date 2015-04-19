'use strict';
var test = require('ava');
var ghGot = require('./');

test('default', function (t) {
	t.plan(1);

	ghGot('users/sindresorhus', function (err, data) {
		t.assert(data.login === 'sindresorhus');
	});
});

test('should accept options', function (t) {
	t.plan(1);

	ghGot('users/sindresorhus', {}, function (err, data) {
		t.assert(data.login === 'sindresorhus');
	});
});

test('token option', function (t) {
	t.plan(1);

	ghGot('users/sindresorhus', {token: 'fail'}, function (err, data) {
		t.assert(err, err);
	});
});

test('endpoint option', function (t) {
	t.plan(1);

	ghGot('users/sindresorhus', {endpoint: 'fail'}, function (err, data) {
		t.assert(err, err);
	});
});
