'use strict';
var test = require('ava');
var ghGot = require('./');

test(function (t) {
	t.plan(1);

	ghGot('users/sindresorhus', function (err, data) {
		t.assert(data.login === 'sindresorhus');
	});
});
