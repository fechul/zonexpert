var express = require('express');
var http = require('http');
var async = require('async');

var router = express.Router();

var user = require('../core/user.js');
var auth = require('../core/auth.js');
var schedule = require('../core/schedule.js');
var board = require('../core/board.js');
var prediction = require('../core/prediction.js');

var need_login = function(req, res, next) {
	if (req.session.login) {
		next()
	} else {
		res.json(false);
	}
};

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
		'password_check': req.body.password_check,
		'main_sport': req.body.main_sport,
		'main_league': req.body.main_league
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

router.post('/board/update', function(req, res) {
	board.update({
		title: req.body.title,
		content: req.body.content,
		boardNo: req.body.boardNo,
		user: req.session.email
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
	schedule.getLeagueMatches({
		'leagueId': req.query.leagueId
	}, function(matches) {
		res.json(matches);
	});
});

router.post('/prediction', function(req, res) {
	var predictions = JSON.parse(req.body.predictions);

	prediction.confirm({
		'userEmail': req.session.email,
		'beforeRating': 1500,
		'predictions': predictions
	}, function(add) {
		res.json(add);
	});
});

router.get('/prediction', function(req, res) {
	prediction.get({
		'userEmail': req.session.email,
		'leagueId': req.query.leagueId
	}, function(prediction) {
		res.json(JSON.stringify(prediction));
	});
});

router.get('/prediction/basket', need_login, function(req, res) {
	prediction.getBasketList({
		'userEmail': req.session.email,
		'leagueId': req.body.leagueId
	}, function(baskets) {
		var basketIdList = [];

		for (var i in baskets) {
			basketIdList.push(baskets[i].matchId);
		}

		schedule.getMatches({
			'idList': basketIdList
		}, function(matches) {
			res.json(JSON.stringify(matches));
		});
	});
});

router.post('/prediction/basket', need_login, function(req, res) {
	prediction.add({
		'userEmail': req.session.email,
		'matchId': req.body.matchId
	}, function(add) {
		res.json(add);
	});
});

router.delete('/prediction/basket', need_login, function(req, res) {
	prediction.del({
		'userEmail': req.session.email,
		'matchId': req.body.matchId
	}, function(del) {
		res.json(del);
	});
});

router.get('/prediction/basket/unconfirmed', need_login, function(req, res) {
	prediction.getUnconfirmedBasketList({
		'userEmail': req.session.email
	}, function(baskets) {
        var basketIdList = [];
        for (var i in baskets) {
            basketIdList.push(baskets[i].matchId);
        }

		schedule.getMatches({
			'idList': basketIdList
		}, function(matches) {
			var result = [];
			for (var i in matches) {
				result[i] = {};
				result[i].id = matches[i].id;
				result[i].date = matches[i].date;
				result[i].homeTeamName = matches[i].homeTeamName;
				result[i].awayTeamName = matches[i].awayTeamName;

				var basketIndex = basketIdList.indexOf(matches[i].id);
				if (basketIndex > -1) {
					result[i].pick = baskets[basketIndex].pick;
				}
			}

			res.json(JSON.stringify(result));
		});
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
