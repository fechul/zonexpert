var express = require('express');
var http = require('http');
var async = require('async');

var router = express.Router();

var user = require('../core/user.js');
var auth = require('../core/auth.js');
var schedule = require('../core/schedule.js');
var board = require('../core/board.js');
// var chat = require('../core/chat.js');
var prediction = require('../core/prediction.js');
var rating = require('../core/rating.js');

var need_login = function(req, res, next) {
	if (req.session.login) {
		next()
	} else {
		res.json(false);
	}
};

var getSportsName = function(code) {
	code = (code || '').toString();
	switch(code) {
		case '1':
			return '축구';
			break;
		case '2':
			return '야구';
			break;
		default:
			return '-';
			break;
	}
}

var getLeagueName = function(code) {
	code = (code || '').toString();
	switch(code) {
		case '426':
			return '프리미어리그';
			break;
		case '429':
			return '잉글랜드FA컵';
			break;
		case '430':
			return '분데스리가';
			break;
		case '432':
			return '포칼컵';
			break;
		case '433':
			return '에레디비시';
			break;
		case '434':
			return '리그 1';
			break;
		case '436':
			return '라리가';
			break;
		case '438':
			return '세리에 A';
			break;
		case '439':
			return '포르투갈';
			break;
		case '440':
			return '챔피언스리그';
			break;
		case 'kbo2017':
			return 'KBO';
			break;
		default:
			return '-';
			break;
	}
};

var getCostPoint = function(email, callback) {
	var costPoint = 100;
	user.countAllUsers('onlyRanked', function(userCount) {
		redis_client.zrevrank('rating_rank', email, function(err, data) {
			if(!err) {
				var myTotalRate = (((data+1) / userCount)*100).toFixed(2);

				if(myTotalRate <= 3) {
					costPoint = 300;
				} else if(3 < myTotalRate && myTotalRate <= 10) {
					costPoint = 250;
				} else if(10 < myTotalRate && myTotalRate <= 30) {
					costPoint = 200;
				} else if(30 < myTotalRate && myTotalRate <= 70) {
					costPoint = 150;
				} else if(70 < myTotalRate) {
					costPoint = 100;
				}
			}

			callback(costPoint);
		});
	});
};

router.post('/football-data.events', function(req, res) {
	console.log(req.body);
	console.log(req.params);
	res.json(true);
});

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
		res.redirect('/signup_complete');
	});
});

router.post('/accounts/change', function(req, res) {
	user.changeInfo({
		'email': req.session.email,
		'nickname': req.body.nickname,
		'password': req.body.password,
		'password_check': req.body.password_check
	}, function(changeInfo) {
		res.json(changeInfo);
	});
});

router.get('/board/get', function(req, res) {
	var value = req.query.value || '';
	var type = req.query.type || '';

	board.get({
		'value': value,
		'type': type,
		'myEmail': req.session.email || null
	}, function(data) {
		console.log("ddd: ", data)
		user.countAllUsers('onlyRanked', function(userCount) {
			async.mapSeries(data, function(board, async_cb) {
				redis_client.zrevrank('rating_rank', board.writer, function(err, rank) {
					if(rank || rank == 0) {
	    				rank += 1;
	    				var myTotalRate = ((rank / userCount)*100).toFixed(2);
	    				board.myTotalRate = myTotalRate;
					}
					async_cb();
				});
			}, function(async_err) {
				res.json(data);
			});
		});
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
		'predictions': predictions
	}, function(add) {
		res.json(add);
	});
});

router.get('/prediction', function(req, res) {
	prediction.get({
		'userEmail': req.session.email,
		'leagueId': req.query.leagueId
	}, function(predictions) {
		var predictionIdList = [];

		for (var i in predictions) {
			predictionIdList.push(predictions[i].matchId);
		}

		schedule.getMatches({
			'idList': predictionIdList
		}, function(matches) {
			res.json(JSON.stringify(matches));
		});
	});
});

router.get('/prediction/wait', function(req, res) {
	prediction.get({
		'userEmail': req.session.email,
		'leagueId': req.query.leagueId,
		'result': 'wait'
	}, function(predictions) {
		var predictionIdList = [];
		var pickObject = {};

		for (var i in predictions) {
			predictionIdList.push(predictions[i].matchId);
			pickObject[predictions[i].matchId] = predictions[i].pick;
		}

		schedule.getMatches({
			'idList': predictionIdList
		}, function(matches) {
			for (var i in matches) {
				matches[i] = matches[i].toObject();
				matches[i].pick = pickObject[matches[i].id];
			}

			res.json(JSON.stringify(matches));
		});
	});
});

router.get('/prediction/all', function(req, res) {
	prediction.getAll({
		'userEmail': req.session.email,
		'leagueId': req.query.leagueId
	}, function(prediction) {
		res.json(JSON.stringify(prediction));
	});
});

router.get('/prediction/basket/', need_login, function(req, res) {
	prediction.getBasketList({
		'userEmail': req.session.email
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

router.get('/prediction/getUserList', function(req, res) {
	var matchId = req.query.matchId;
	var email = req.session.email;
	var sportsId = req.query.sportsId;

	prediction.getUserList({
		'matchId': matchId,
		'sportsId': sportsId,
		'email': email
	}, function(data) {
		if(data && data.length) {
			user.countAllUsers('onlyRanked', function(userCount) {
				async.map(data, function(each, async_cb) {
					redis_client.zrevrank('rating_rank', each.email, function(search_err, search_data) {
						if(search_data || search_data == 0) {
		    				var target_rank = search_data + 1;
							var myTotalRate = ((target_rank / userCount)*100).toFixed(2);
							each.myTotalRate = myTotalRate;
						}
						async_cb();
					});
				}, function(async_err) {
					res.json(data);
				});
			});
		} else {
			res.json(data);
		}
	});
});

router.get('/prediction/getUserInfo', function(req, res) {
	var nick = req.query.target;
	var matchId = req.query.matchId;
	var sportsId = req.query.sportsId;

	user.get_email(nick, function(email) {
		if(email) {
			user.get_rank_data([email], function(data) {
				if(data && data.length) {
					prediction.getViewList({
						'matchId': matchId,
						'sportsId': sportsId,
						'userEmail': email
					}, function(viewList) {
						data[0].viewList = viewList;

						var key = 'rating_rank';
						user.countAllUsers('onlyRanked', function(userCount) {
							redis_client.zrevrank(key, email, function(err, rankData) {
								if(!err) {
									var costPoint = 100;
									var myTotalRate = (((rankData+1) / userCount)*100).toFixed(2);
									var tierClassName = '';
									var tierName = '';
									var tierImg = '';

									if(myTotalRate <= 3) {
										costPoint = 300;
										tierClassName = 'badge_diamond';
										tierName = '다이아몬드';
										tierImg = 'image/badge_diamond.png';
									} else if(3 < myTotalRate && myTotalRate <= 10) {
										costPoint = 250;
										tierClassName = 'badge_platinum';
										tierName = '플래티넘';
										tierImg = 'image/badge_platinum.png';
									} else if(10 < myTotalRate && myTotalRate <= 30) {
										costPoint = 200;
										tierClassName = 'badge_gold';
										tierName = '골드';
										tierImg = 'image/badge_gold.png';
									} else if(30 < myTotalRate && myTotalRate <= 70) {
										costPoint = 150;
										tierClassName = 'badge_silver';
										tierName = '실버';
										tierImg = 'image/badge_silver.png';
									} else if(70 < myTotalRate) {
										costPoint = 100;
										tierClassName = 'badge_bronze';
										tierName = '브론즈';
										tierImg = 'image/badge_bronze.png';
									}

									data[0].totalRank = rankData+1;
									data[0].costPoint = costPoint;
									data[0].tierImg = tierImg;
									data[0].tierName = tierName;
									data[0].tierClassName = tierClassName;
								}


								if (viewList.indexOf(req.session.email) > -1) {
									prediction.getPick({
										'matchId': matchId,
										'userEmail': email
									}, function(pick) {
										data[0].pick = pick;
										res.json(data);
									});
								} else {
									res.json(data);
								}
							});
						});
					});
				} else {
					res.json(null);
				}
			});
		} else {
			res.json(null);
		}
	});
});

router.post('/prediction/viewOthers', function(req, res) {
	var targetNickname = req.body.targetNickname;
	var matchId = req.body.matchId;
	var myEmail = req.session.email;
	var pointType = req.body.pointType;

	user.get_email(targetNickname, function(targetEmail) {
		if (targetEmail) {
			getCostPoint(targetEmail, function(costPoint) {
				user.usePoint({
					'email': myEmail,
					'point': costPoint,
					'pointType': pointType,
					'type': 'view',
					'target': targetEmail,
					'matchId': matchId
				}, function(usePointResult) {
					if(usePointResult) {
						prediction.pushViewList({
							'target': targetEmail,
							'myEmail': myEmail,
							'matchId': matchId
						}, function(pushResult) {
							if(pushResult) {
								if (pointType == 'free') {
									prediction.getPick({
										'matchId': matchId,
										'userEmail': targetEmail
									}, function(pick) {
										res.json({
											'result': true,
											'pick': pick
										});
									});
								} else {
									user.earnPoint({
										'email': targetEmail,
										'point': costPoint / 2,
										'type': 'earn',
										'target': myEmail,
										'matchId': matchId
									}, function(earnPointResult) {
										if (earnPointResult) {
											prediction.getPick({
												'matchId': matchId,
												'userEmail': targetEmail
											}, function(pick) {
												res.json({
													'result': true,
													'pick': pick
												});
											});
										} else {
											user.returnPoint({
												'email': myEmail,
												'point': costPoint,
												'pointType': pointType,
												'type': 'view',
												'target': targetEmail,
												'matchId': matchId
											}, function(returnResult) {
												res.json({
													'result': false
												});
											});
										}
									});
								}
							} else {
								user.returnPoint({
									'email': myEmail,
									'point': costPoint,
									'pointType': pointType,
									'type': 'view',
									'target': targetEmail,
									'matchId': matchId
								}, function(returnResult) {
									res.json({
										'result': false
									});
								});
							}
						});
					} else {
						res.json({
							'result': false
						});
					}
				});
			});
		} else {
			res.json({
				'result': false
			});
		}
	});
});

router.get('/prediction/getProceedingPredict', function(req, res) {
	var searchId = req.query.search_id;

	prediction.getProceedingPredict({
		searchId: searchId
	}, function(proceeding) {
		res.json(proceeding);
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

				schedule.update({
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

	var get_tier_info = function(myTotalRate) {
		var tier_obj = {};

		if(myTotalRate <= 3) {
			tier_obj.name = '다이아몬드';
			tier_obj.img = 'image/badge_diamond.png';
		} else if(3 < myTotalRate && myTotalRate <= 10) {
			tier_obj.name = '플래티넘';
			tier_obj.img = 'image/badge_platinum.png';
		} else if(10 < myTotalRate && myTotalRate <= 30) {
			tier_obj.name = '골드';
			tier_obj.img = 'image/badge_gold.png';
		} else if(30 < myTotalRate && myTotalRate <= 70) {
			tier_obj.name = '실버';
			tier_obj.img = 'image/badge_silver.png';
		} else if(70 < myTotalRate) {
			tier_obj.name = '브론즈';
			tier_obj.img = 'image/badge_bronze.png';
		}

		return tier_obj;
	};

	user.get_rank_data([email], function(mydata) {
		user.countAllUsers('onlyRanked', function(userCount) {
			redis_client.zrevrank('rating_rank', email, function(err, data) {
				if(!err) {
					var myRank = data+1;
					var myTotalRate = ((myRank / userCount)*100).toFixed(2);
					if(mydata && mydata.length) {
						mydata = mydata[0];

						mydata_obj.mydata_user_id = mydata.nickname;
						mydata_obj.mydata_user_main_field = getSportsName(mydata.main_sport) + '/' + getLeagueName(mydata.main_league);
						mydata_obj.my_rating = (mydata.readyGameCnt && mydata.readyGameCnt > 0) ? '배치중' : mydata.rating;
						var tierInfo = get_tier_info(myTotalRate);
						mydata_obj.my_tier_name = (mydata.readyGameCnt && mydata.readyGameCnt > 0) ? '배치중' : tierInfo.name;
						mydata_obj.my_tier_img = (mydata.readyGameCnt && mydata.readyGameCnt > 0) ? 'image/badge_ready.png' : tierInfo.img;

						if (mydata.record) {
							mydata_obj.my_total_hit = mydata.record.total.hit;
							mydata_obj.my_total_fail = mydata.record.total.fail;

							if(mydata.record.total.fail || mydata.record.total.hit ) {
								mydata_obj.my_predict_rate = ((mydata.record.total.hit/(mydata.record.total.hit+mydata.record.total.fail))*100).toFixed(2);
							}
						}
						res.json(mydata_obj);
					}
				} else {
					res.json(mydata_obj);
				}
			});
		});
	});
});

router.get('/getMyRecentPredict', function(req, res) {
	var email = req.session.email;

	prediction.getRecentPredict({
		'email': email
	}, function(data) {
		res.json(data);
	});
});

router.get('/getTopTen', function(req, res) {
	var type = req.query.type;
	var key = type + '_rank';

	start = 1 - 1;
	end = 10 - 1;

	user.countAllUsers('onlyRanked', function(userCount) {
		redis_client.zrevrange(key, start, end, function(err, data) {
			if(data && data.length) {
				user.get_rank_data(data, function(toptenData) {
					if(toptenData && toptenData.length) {
						var rank = 1;
						async.mapSeries(toptenData, function(eachData, async_cb) {
							var myTotalRate = ((rank / userCount)*100).toFixed(2);
							eachData.myTotalRate = myTotalRate;
							rank++;
							async_cb();
						}, function(async_err) {
							if(async_err) {
								res.json(null);
							} else {
								res.json(toptenData);
							}
						});
					} else {
						res.json(null);
					}
				});
			} else {
				res.json(null);
			}
		});
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

router.post('/ratingUpdate', function(req, res) {
	var matchId = req.body.matchId;
	console.log(matchId);

	rating.addQueue({
		'matchId': matchId
	}, function() {
		res.json(true);
	});
});

router.post('/feedback', function(req, res) {
	var newFeedBack = new db.feedback({
		'createTime': new Date,
		'email': req.body.feedback_email || '',
		'contents': req.body.feedback_contents || '',
		'url': req.body.url
	});

	newFeedBack.save(function(err) {
		if (err) {
			res.json(false);
		} else {
			res.json(true);
		}
	});
});

router.post('/user/leave', need_login, function(req, res) {
	var email = req.session.email;
	var leaveReason = req.body.leaveReason;
	var password = req.body.password;

	user.login({
		email: email,
		password: password
	}, function(check) {
		if(check.result) {
			user.leave({
				email: email,
				leaveReason: leaveReason
			}, function(leave) {
				if(leave) {
					var keys = ['rating_rank', 'game_cnt_rank', 'predict_rate_rank'];
					async.each(keys, function(key, async_cb) {
						redis_client.zrem(key, email, function(err, data) {
							async_cb();
						});
					}, function(async_err) {
						res.json({
							result: true
						});
					});
				} else {
					res.json({
						result: false,
						code: 4
					});
				}
			});
		} else {
			res.json({
				result: false,
				code: check.code
			});
		}
	});
});

router.get('/user/point', need_login, function(req, res) {
	user.getPoint(req.session.email, function(result) {
		res.json(result);
	});
});

module.exports = router;
