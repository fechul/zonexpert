var express = require('express');
var http = require('http');
var async = require('async');

var router = express.Router();

var user = require('../core/user.js');
var auth = require('../core/auth.js');
var schedule = require('../core/schedule.js');
var board = require('../core/board.js');
var chat = require('../core/chat.js');
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

router.get('/prediction/getRatingChange', function(req, res) {
	var dates = req.query.dates;
	prediction.getRatingChange(dates, function(ratings) {
		if(ratings && ratings.length) {
			res.json(ratings);
		} else {
			res.json(null);
		}
	});
});

router.get('/prediction/getMatchesStatistics', function(req, res) {
	var nick = req.query.search_id;
	var type = req.query.type;

	prediction.getMatchesStatistics({
		'nick': nick,
		'type': type
	}, function(data) {
		res.json(data);
	});
});

router.get('/prediction/getMatchesRecord', function(req, res) {
	var nick = req.query.search_id;

	prediction.getMatchesRecord({
		'nick': nick
	}, function(data) {
		res.json(data);
	});
});

router.all('/test/schedule_initialize', function(req, res) {
	var leaguesObject = {};
	var leagueIdArray = [426, 429, 430, 432, 433, 434, 436, 438, 439, 440];
	// 프리미어리그 426   FA컵 429   분데스리가 430   포칼컵 432
	// 에레디비지에 433   리그앙 434   라리가 436   세리에 438
	// 포르투갈 439   챔스 440
	var options = {
	  'host': 'api.football-data.org',

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

router.get('/getMyData', function(req, res) {
	var email = req.session.email;
	var mydata_obj = {};

	var get_tier_info = function(rating) {
		rating = parseInt(rating);
		var tier_obj = {};

		if(rating < 1200) {
			tier_obj.name = '브론즈';
			tier_obj.img = 'image/badge_bronze.png';
		} else if(1200 <= rating && rating < 1400) {
			tier_obj.name = '실버';
			tier_obj.img = 'image/badge_silver.png';
		} else if(1400 <= rating && rating < 1600) {
			tier_obj.name = '골드';
			tier_obj.img = 'image/badge_gold.png';
		} else if(1600 <= rating && rating < 1800) {
			tier_obj.name = '플래티넘';
			tier_obj.img = 'image/badge_platinum.png';
		} else if(1800 <= rating) {
			tier_obj.name = '다이아몬드';
			tier_obj.img = 'image/badge_diamond.png';
		}

		return tier_obj;
	};

	var get_sport_name = function(code) {
		switch(code) {
			case 1:
				return '축구';
				break;
			default:
				return '-';
				break;
		}
	};

	var get_league_name = function(code) {
		switch(code) {
			case 426:
				return '프리미어리그';
				break;
			case 429:
				return '잉글랜드FA컵';
				break;
			case 430:
				return '분데스리가';
				break;
			case 432:
				return '포칼컵';
				break;
			case 433:
				return '에레디비시';
				break;
			case 434:
				return '리그 1';
				break;
			case 436:
				return '라리가';
				break;
			case 438:
				return '세리에 A';
				break;
			case 439:
				return '포르투갈';
				break;
			case 440:
				return '챔피언스리그';
				break;
			default:
				return '-';
				break;
		}
	};

	user.get_rank_data([email], function(mydata) {
		if(mydata && mydata.length) {
			mydata = mydata[0];

			mydata_obj.mydata_user_id = mydata.nickname;
			mydata_obj.mydata_user_main_field = get_sport_name(mydata.main_sport) + '/' + get_league_name(mydata.main_league);
			mydata_obj.my_rating = mydata.rating;
			mydata_obj.my_tier_name = get_tier_info(mydata.rating).name;
			mydata_obj.my_tier_img = get_tier_info(mydata.rating).img;

			if(mydata.record) {
				if(mydata.record.total) {
					mydata_obj.my_total_hit = mydata.record.total.hit || 0;
					mydata_obj.my_total_fail = mydata.record.total.fail || 0;

					if(mydata.record.total.fail) {
						mydata_obj.my_predict_rate = ((mydata.record.total.hit/(mydata.record.total.hit+mydata.record.total.fail))*100).toFixed(2);
					}
				}
			}
		}

		res.json(mydata_obj);
	});
});

router.get('/getTopTen', function(req, res) {
	var type = req.query.type;
	var key = type + '_rank';

	start = 1 - 1;
	end = 10 - 1;

	redis_client.zrevrange(key, start, end, function(err, data) {
		if(data) {
			user.get_rank_data(data, function(toptenData) {
				if(toptenData && toptenData) {
					res.json(toptenData);
				} else {
					res.json(null);
				}
			});
		} else {
			res.json(null);
		}
	});
});

router.all('/test/team_initialize', function(req, res) {
	var leaguesObject = {};
	var leagueIdArray = [426, 429, 430, 432, 433, 434, 436, 438, 439, 440];
	// 프리미어리그 426   FA컵 429   분데스리가 430   포칼컵 432
	// 에레디비지에 433   리그앙 434   라리가 436   세리에 438
	// 포르투갈 439   챔스 440
	var options = {
	  'host': 'api.football-data.org'
	};

	async.each(leagueIdArray, function(league, async_cb) {
	 	options.path =  '/v1/competitions/' + league + '/teams';
		leaguesObject[league] = '';
		callback = function(response) {
			response.on('data', function (chunk) {
				leaguesObject[league] += chunk;
			});

			response.on('end', function () {
				leaguesObject[league] = JSON.parse(leaguesObject[league]);
				async_cb();
			});
		}

		http.request(options, callback).end();

	}, function(async_err) {
		if(async_err) {
			res.json(false);
		} else {
			schedule.team_initialize(leaguesObject, function() {
				res.json(true);
			});
		}
	});
});

module.exports = router;
