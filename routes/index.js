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


var rule = new node_schedule.RecurrenceRule();
rule.minute = 14;
var rule1 = new node_schedule.RecurrenceRule();
rule1.minute = 00;

var scheduleJob = node_schedule.scheduleJob(rule, function(){
	var options = {
  host: 'api.football-data.org',
  path: '/v1/fixtures/'
};

callback = function(response) {
  var str = '';

  //another chunk of data has been recieved, so append  it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    // console.log(str);
		schedule.update_schedule(str, function() {

		});
  });
}

http.request(options, callback).end();

});


module.exports = router;
