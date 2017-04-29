var express = require('express');
var router = express.Router();

var user = require('../core/user.js');
var auth = require('../core/auth.js');

router.all('/ping', function(req, res) {
	res.send('pong\n');
});

router.post('/login', function(req, res) {
	user.login({
		'id': req.body.id,
		'password': req.body.password
	}, function(login) {
		if (login.result) {
			req.session.login = true;
			req.session.id = login.id;
			req.session.email = login.email;
		}

		delete login.id;
		delete login.email;

		res.json(login);
	});
});

router.post('/logout', function(req, res) {
	req.session.detroy(function(err) {
		res.redirect('/');
	});
});

router.post('/accounts', function(req, res) {
	user.join({
		'id': req.body.id,
		'email': req.body.email,
		'password': req.body.password,
		'password_check': req.body.password_check
	}, function(result) {
		res.json(result);
	});
});

router.get('/auth/join', function(req, res) {
	auth.join({
		'token': req.query.token
	}, function(response) {
		console.log(response);
		if (response.result) {
			res.redirect('/');
		} else {
			res.redirect('/');
		}
	});
});

module.exports = router;
