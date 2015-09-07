'use strict';
var test = require('ava');
var ghGot = require('./');

test('default', function (t) {
	return ghGot('users/sindresorhus').then(function (res) {
		t.is(res.body.login, 'sindresorhus');
	});
});

test('should accept options', function (t) {
	return ghGot('users/sindresorhus', {}).then(function (res) {
		t.is(res.body.login, 'sindresorhus');
	});
});

test('token option', function (t) {
	return ghGot('users/sindresorhus', {token: 'fail'}).catch(function (err) {
		t.assert(err);
	});
});

test('endpoint option', function (t) {
	return ghGot('users/sindresorhus', {endpoint: 'fail'}).catch(function (err) {
		t.assert(err);
	});
});
