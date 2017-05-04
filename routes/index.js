var express = require('express');
var http = require('http');
var async = require('async');

var router = express.Router();

var user = require('../core/user.js');
var auth = require('../core/auth.js');
var schedule = require('../core/schedule.js');
var board = require('../core/board.js');

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

router.get('/board/get', function(req, res) {
	board.get(req.session.email, function(data) {
		res.json(data);
	});
});

router.post('/board/write', function(req, res) {
	board.write({
		title: req.body.title,
		content: req.body.content,
		writer: req.session.email
	}, function(result) {
		res.json(result);
	});
});

router.post('/board/del', function(req, res) {
	board.del({
		'boardNo': req.body.boardNo,
		'user_email': req.session.email
	}, function(result) {
		res.json(result);
	});
});

router.post('/board/like', function(req, res) {
	board.like({
		'boardNo': req.body.boardNo,
		'user_email': req.session.email
	}, function(result) {
		res.json(result);
	});
});

router.get('/schedule/league', function(req, res) {
	console.log(req.query.leagueId);
	schedule.getLeagueMatches({
		'leagueId': req.query.leagueId
	}, function(matches) {
		res.json(matches);
	});
});

router.all('/test/schedule_initialize', function(req, res) {
	var leaguesObject = {};
	var leagueIdArray = [426, 429, 430, 432, 433, 434, 436, 438, 439, 440];
	// 프리미어리그 426   FA컵 429   분데스리가 430   포칼컵 432
	// 에레디비지에 433   리그앙 434   라리가 436   세리에 438
	// 포르투갈 439   챔스 440
	var options = {
	  'host': 'api.football-data.org'
	};

	async.eachSeries(leagueIdArray, function(league, async_cb) {
	 	options.path =  '/v1/competitions/' + league + '/fixtures';
		leaguesObject[league] = '';
		callback = function(response) {
			response.on('data', function (chunk) {
				leaguesObject[league] += chunk;
			});

			response.on('end', function () {
				leaguesObject[league] = JSON.parse(leaguesObject[league]);

				schedule.initialize({
					'leagueId': league,
					'schedules': leaguesObject[league].fixtures
				}, function() {
					async_cb();
				});
			});
		}

		http.request(options, callback).end();

	}, function(async_err) {
		if(async_err) {

		} else {

		}

		res.json(true);
	});
});

module.exports = router;
