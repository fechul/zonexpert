var express = require('express');
var http = require('http');
var node_schedule = require('node-schedule');
var router = express.Router();

var user = require('../core/user.js');
var auth = require('../core/auth.js');
var schedule = require('../core/schedule.js');

router.all('/ping', function(req, res) {
	res.send('pong\n');
});

router.post('/login', function(req, res) {
	user.login({
		'email': req.body.email,
		'password': req.body.password
	}, function(login) {
		if (login.result) {
			req.session.login = true;
			req.session.email = login.email;
			req.session.nickname = login.nickname;
		}

		delete login.email;
		delete login.nickname;

		res.json(login);
	});
});

router.post('/logout', function(req, res) {
	var json = {
		'result': true
	};

	req.session.destroy(function(err) {
		if (err) {
			json.result = false;
		}

		res.json(json);
	});
});

router.post('/accounts', function(req, res) {
	user.signup({
		'email': req.body.email,
		'nickname': req.body.nickname,
		'password': req.body.password,
		'password_check': req.body.password_check
	}, function(signup) {
		res.json(signup);
	});
});

router.get('/auth/signup', function(req, res) {
	auth.signup({
		'token': req.query.token
	}, function(signup) {
		res.json(signup);
	});
});

router.post('/prediction', function(req, res) {
	var predictions = JSON.parse(req.body.predictions);

	prediction.add({
		'user_email': req.session.email,
		'before_rating': 1500,
		'predictions': predictions
	}, function(add) {
		res.json(add);
	});
});

router.get('/prediction', function(req, res) {
	prediction.get({
		'user_email': req.session.email
	}, function(prediction) {
		res.json(JSON.stringify(prediction));
	});
});

module.exports = router;
