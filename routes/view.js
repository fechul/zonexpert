var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();

var board = require('../core/board.js');
var user = require('../core/user.js');
var schedule = require('../core/schedule.js');
var prediction = require('../core/prediction.js');
// 체크
// 로그인 상태에서만 접속 가능한 페이지 체크
// router.get('/url', need_login, function(req, res) {}) 형식으로 사용
var need_login = function(req, res, next) {
	if (req.session.login) {
		next();
	} else {
		res.redirect('/login');
	}
};

// 로그인 상태에서 접속 불가능한 페이지 체크
var no_login = function(req, res, next) {
	if (req.session.login) {
		res.redirect('/');
	} else {
		next();
	}
};

var readPredictionShortcutHTML = function(req, res, next) {
	if (req.session.login) {
		fs.readFile('./views/prediction_shortcut.html', function(err, data) {
			req.predictionShortcut = data;
			next();
		});
	} else {
		req.predictionShortcut = '';
		next();
	}
};

var readFeedbackHTML = function(req, res, next) {
	fs.readFile('./views/feedback.html', function(err, data) {
		req.feedback = data;
		next();
	});
};

var checkAttendancePoint = function(req, res, next) {
	if(req.session.login) {
		user.checkAttendancePoint(req.session.email, function(pointData) {
			req.attendancePointUpdated = pointData.attendancePointUpdated;
			req.point = pointData.point;
			next();
		});
	} else {
		req.attendancePointUpdated = false;
		req.point = 0;
		next();
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
}

router.get('/', readPredictionShortcutHTML, readFeedbackHTML, checkAttendancePoint, function(req, res) {
	var path = 'index.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		headerHideMenu: '',
		myNickname: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point
	};

	json.prediction_shortcut = req.predictionShortcut;
	json.feedback = req.feedback;

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
		json.myNickname = req.session.nickname;
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}
	res.render(path, json);
});

router.get('/signup', no_login, readFeedbackHTML, function(req, res) {
	var path = 'signup.html';
	var json = {
		headerHideMenu: 'display:none;',
		login_display: 'display:none;',
		signup_display: 'display:none;',
		myinfo_display: 'display:none;',
		logout_display: 'display:none;',
		myCurrentPoint: 0
	};

	json.feedback = req.feedback;

	res.render(path, json);
});

router.get('/login', no_login, readFeedbackHTML, function(req, res) {
	var path = 'login.html';
	var json = {
		headerHideMenu: 'display:none;',
		login_display: 'display:none;',
		signup_display: 'display:none;',
		myinfo_display: 'display:none;',
		logout_display: 'display:none;',
		myCurrentPoint: 0
	};

	json.feedback = req.feedback;

	res.render(path, json);

});

router.get('/rank', readPredictionShortcutHTML, readFeedbackHTML, checkAttendancePoint, function(req, res) {
	var path = 'rank.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		rank_html: '',
		headerHideMenu: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	var key = 'rating_rank';
	// var key = 'game_cnt_rank';
	// var key = 'predict_rate_rank';

	var get_rank_range = function(start, search_target) {
    	var start = start;
    	var end = start + 99;

    	start -= 1;
		end -= 1;

	    // add rank to redis server
		// var score = 1750;
		// var id = "zonexpert104@zonexpert.com";
		// redis_client.zadd(key, score, id, function(err, reply) {
		//     if(err){
		//         console.log("error");
		//         return;
		//     } else{
		//         console.log("ranking : " + reply);
		//     }
		// });

		//get rank from redis server

	    redis_client.zrevrange(key, start, end, function(err, data) {
	        if(err) {
	            console.log("redis get rank err: ", err);
	            res.render(path, json);
	        } else {
            	user.countAllUsers('onlyRanked', function(userCount) {
            		var redisUserCnt = userCount;
	            	user.get_rank_data(data, function(userdata) {
	            		var rank_table_html = '';

	            		var get_tier_img = function(myTotalRate) {
	            			var tier_img = '';

	            			if(userdata.readyGameCnt && userdata.readyGameCnt > 0) {
								tier_img = '<div><div class="rank_table_tier badge_ready"></div></div>';
							} else {
								if(myTotalRate <= 3) {
									tier_img = '<div><div class="rank_table_tier badge_diamond"></div></div>';
								} else if(3 < myTotalRate && myTotalRate <= 10) {
									tier_img = '<div><div class="rank_table_tier badge_platinum"></div></div>';
								} else if(10 < myTotalRate && myTotalRate <= 30) {
									tier_img = '<div><div class="rank_table_tier badge_gold"></div></div>';
								} else if(30 < myTotalRate && myTotalRate <= 70) {
									tier_img = '<div><div class="rank_table_tier badge_silver"></div></div>';
								} else if(70 < myTotalRate) {
									tier_img = '<div><div class="rank_table_tier badge_bronze"></div></div>';
								}
							}
							return tier_img;
						};

						var rank = 1;
						var type = 'total';
						if(req.query.type) {
							type = req.query.type;
						}

						async.mapSeries(userdata, function(user, _async_cb) {
							rank_table_html += '<tr id="' + (search_target == rank ? 'target_row' : '') + '">';
							rank_table_html += '<td class="table_label_rank">' + rank + '</td>';
							rank_table_html += '<td class="table_label_nickname">' + user.nickname + '</td>';
							rank_table_html += '<td class="table_label_mainsport">' + getSportsName(user.main_sport) + '/' + getLeagueName(user.main_league) + '</td>';
							rank_table_html += '<td class="table_label_score">' + parseInt(user.rating, 10) + '</td>';

							if(user.record) {
								if(user.record[type]) {
									rank_table_html += '<td class="table_label_record">' + (user.record[type].hit || 0) + ' / ' + (user.record[type].fail || 0) + '</td>';
									if(!user.record[type].fail) {
										rank_table_html += '<td class="table_label_hitrate">-</td>';
									} else {
										rank_table_html += '<td class="table_label_hitrate">' + ((user.record[type].hit/(user.record[type].hit + user.record[type].fail))*100).toFixed(2) + '%</td>';
									}
								} else {
									rank_table_html += '<td class="table_label_record">0 / 0</td>';
									rank_table_html += '<td>-</td class="table_label_hitrate">';
								}
							} else {
								rank_table_html += '<td class="table_label_record">0 / 0</td>';
								rank_table_html += '<td class="table_label_hitrate">-</td>';
							}

							var myTotalRate = ((rank / redisUserCnt)*100).toFixed(2);

							rank_table_html += '<td class="tier_cell table_label_tier">' + get_tier_img(myTotalRate) + '</td>';
							rank_table_html += '</tr>';
							rank++;
							_async_cb();
						}, function(_async_err) {
							json.rank_html = rank_table_html;

	            			res.render(path, json);
						});
	            	});
	            });
	        }
	    });
    };

    json.prediction_shortcut = req.predictionShortcut;
	json.feedback = req.feedback;

    var search_id = req.query.search_id;
    if(search_id) {
    	search_id = search_id.replace(/ /g, '');
    	user.get_email(search_id, function(email) {
    		if(email) {
    			redis_client.zrevrank(key, email, function(search_err, search_data) {
    				if(search_data || search_data == 0) {
	    				var target_rank = search_data + 1;
						var start_range = Math.floor(target_rank/100) * 100;
						start_range += 1;
						get_rank_range(start_range, target_rank);
    				} else {
    					json.rank_html = '<tr><td colspan="7">검색 결과가 없습니다.</td></tr>';
    					res.render(path, json);
    				}
				});
    		} else {
    			json.rank_html = '<tr><td colspan="7">검색 결과가 없습니다.</td></tr>';
    			res.render(path, json);
    		}
    	});
	} else {
		get_rank_range(1, null);
	}
});

router.get('/board', readPredictionShortcutHTML, readFeedbackHTML, checkAttendancePoint, function(req, res) {
	var path = 'board.html';
	console.log('email : ', req.session.email);
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		user_email: req.session.email,
		headerHideMenu: '',
		board_html:'',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}


	json.prediction_shortcut = req.predictionShortcut;
	json.feedback = req.feedback;

    res.render(path, json);

});

router.get('/board/write', need_login, readPredictionShortcutHTML, readFeedbackHTML, checkAttendancePoint, function(req, res) {
	var boardNo = req.query.no;
	var path = 'board_write.html';

	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		boardNo: (boardNo || -1),
		board_title: '',
		board_content: '',
		isUpdate: false,
		write_btn_name: '',
		headerHideMenu: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	json.prediction_shortcut = req.predictionShortcut;
	json.feedback = req.feedback;

	if(boardNo) {	//update
		json.write_btn_name = '수정하기';
		board.get_content(boardNo, function(board_data) {
			if(board_data.writer == req.session.email) {
				json.board_title = board_data.title;
				json.board_content = board_data.content;
				json.isUpdate = true;
				res.render(path, json);
			} else {
				res.json(false);
			}
		});
	} else {	//new write
		json.write_btn_name = '작성하기';
		res.render(path, json);
	}
});

router.get('/schedule', readPredictionShortcutHTML, readFeedbackHTML, checkAttendancePoint, function(req, res) {
	var path = 'schedule.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		headerHideMenu: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	json.prediction_shortcut = req.predictionShortcut;
	json.feedback = req.feedback;

	res.render(path, json);
});

router.get('/match/:matchId', readPredictionShortcutHTML, readFeedbackHTML, checkAttendancePoint, function(req, res){
	var path = 'chat_client.html';
	var matchId = req.params.matchId;

	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		my_nickname: req.session.nickname,
		matchId: req.params.matchId,
		myBadge: 'ready',
		myBadgeSrc: '/image/badge_ready.png',
		matchId: req.params.matchId,
		headerHideMenu: '',
		goalsHomeTeam: '',
		goalsAwayTeam: '',
		chatMatchStatus: '',
		chatMatchStatusClass: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point,
		myEmail: ''
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
		json.myEmail = req.session.email;
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	schedule.getMatch({
		'matchId': matchId
	}, function(matchData) {
		matchData.roomOpen = true;	//test
		if (matchData && (matchData.status != 'FINISHED')) {
			if (matchData.result) {
				json.goalsHomeTeam = matchData.result.goalsHomeTeam == null ? '-' : matchData.result.goalsHomeTeam;
				json.goalsAwayTeam = matchData.result.goalsAwayTeam == null ? '-' : matchData.result.goalsAwayTeam;
			}

			if (matchData.status == 'IN_PLAY') {
				json.chatMatchStatus = ':';
				json.chatMatchStatusClass = 'playing';
			} else if (matchData.status == 'FINISHED') {
				json.chatMatchStatus = '종료';
				json.chatMatchStatusClass = 'finished';
			} else {
				json.chatMatchStatus = '예정';
				json.chatMatchStatusClass = 'not_started';
			}

			if(req.session.login) {
				json.login_display = 'display:none;';
				json.signup_display = 'display:none;';
			} else {
				json.myinfo_display = 'display:none;';
				json.logout_display = 'display:none;';
				json.mydata_display = 'display:none;';
			}

			json.sportsId = matchData.sportsId;
			json.leagueId = matchData.leagueId;

			user.get(req.session.email, function(userData) {
				if(userData) {
					json.my_nickname = userData.nickname;

					user.countAllUsers('onlyRanked', function(userCount) {
						redis_client.zrevrank('rating_rank', userData.email, function(err, data) {
				        	if(!err) {
				        		var myRank = data+1;
				        		var myTotalRate = ((myRank / userCount)*100).toFixed(2);

				        		if(userData.readyGameCnt && userData.readyGameCnt > 0) {
										json.myBadge = 'ready';
										json.myBadgeSrc = '/image/badge_ready.png';
								} else {
									if(myTotalRate <= 3) {
										json.myBadge = 'diamond';
										json.myBadgeSrc = '/image/badge_diamond.png';
									} else if(3 < myTotalRate && myTotalRate <= 10) {
										json.myBadge = 'platinum';
										json.myBadgeSrc = '/image/badge_platinum.png';
									} else if(10 < myTotalRate && myTotalRate <= 30) {
										json.myBadge = 'gold';
										json.myBadgeSrc = '/image/badge_gold.png';
									} else if(30 < myTotalRate && myTotalRate <= 70) {
										json.myBadge = 'silver';
										json.myBadgeSrc = '/image/badge_silver.png';
									} else if(70 < myTotalRate) {
										json.myBadge = 'bronze';
										json.myBadgeSrc = '/image/badge_bronze.png';
									}
								}
				        	}

				        	schedule.getMatchTeamsName({
								'matchId': matchId
							}, function(result) {
								json.homeTeamName = result.homeTeamName;
								json.awayTeamName = result.awayTeamName;
								json.homeTeamImg = result.homeTeamImg;
								json.awayTeamImg = result.awayTeamImg;
								json.prediction_shortcut = req.predictionShortcut;
								json.feedback = req.feedback;

								json.prediction_shortcut = req.predictionShortcut;

								prediction.getMatchPrediction({
									'email': req.session.email,
									'matchId': matchId
								}, function(predictionData) {
									if (predictionData) {
										if (predictionData.confirmed) {
											json.predict_in_chat_condition = 'confirmed';
										} else {
											json.predict_in_chat_condition = 'basketed';
										}
									} else {
										json.predict_in_chat_condition = '';
									}

						        	res.render(path, json);
								});
							});
				        });
					});
				} else {
					res.redirect('/schedule');
				}
			});
		} else {
			res.redirect('/schedule');
		}
	});
});

router.get('/search', readPredictionShortcutHTML, readFeedbackHTML, checkAttendancePoint, function(req, res) {
	var path = 'search.html';
	var id = req.query.id;

	var json = {
		logout_display: '',
		login_display: '',
		signup_display: '',
		myinfo_display: '',

		search_show: '',
		no_search_show: '',

		//search data
		searchdata_user_id: id,
		searchdata_tier_img: '',
		searchdata_rating: '-',
		searchdata_tier_name: '-',
		searchdata_total_hit: 0,
		searchdata_total_fail: 0,
		searchdata_predict_rate: '-',
		searchdata_rank: '-',

		myTotalRate: '-',
		headerHideMenu: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
	}

	json.prediction_shortcut = req.predictionShortcut;
	json.feedback = req.feedback;

	user.countAllUsers('onlyRanked', function(userCount) {
		user.get(id, function(userdata) {
			if(!userdata) {
				json.search_show = 'display:none;';
				res.render(path, json);
			} else {
				json.searchdata_user_id = userdata.nickname;

				var rating = userdata.rating;
				json.searchdata_rating = parseInt(rating, 10);

				var total_hit = 0;
				var total_fail = 0;
				if(userdata.record) {
					if(userdata.record.total) {
						var total_hit = userdata.record.total.hit || 0;
						var total_fail = userdata.record.total.fail || 0;
					}
				}

				json.searchdata_total_hit = total_hit;
				json.searchdata_total_fail = total_fail;

				json.searchdata_predict_rate = (total_fail == 0 ? 0 : ((total_hit/(total_hit + total_fail))*100).toFixed(2));

				json.no_search_show = 'display:none;';

				var key = 'rating_rank';

				if(userdata.readyGameCnt && userdata.readyGameCnt > 0) {
	        		json.searchdata_rank = '-';
	        		json.myTotalRate = '-';
		        	res.render(path, json);
				} else {
					redis_client.zrevrank(key, userdata.email, function(err, data) {
			        	if(!err) {
			        		json.searchdata_rank = data+1;
			        		var myTotalRate = (((data+1) / userCount)*100).toFixed(2);
			        		json.myTotalRate = myTotalRate;

			        		if(userdata.readyGameCnt && userdata.readyGameCnt > 0) {
								json.searchdata_tier_img = 'image/badge_ready.png';
								json.searchdata_tier_name = '배치중';
							} else {
								if(myTotalRate <= 3) {
									json.searchdata_tier_img = 'image/badge_diamond.png';
									json.searchdata_tier_name = '다이아몬드';
								} else if(3 < myTotalRate && myTotalRate <= 10) {
									json.searchdata_tier_img = 'image/badge_platinum.png';
									json.searchdata_tier_name = '플래티넘';
								} else if(10 < myTotalRate && myTotalRate <= 30) {
									json.searchdata_tier_img = 'image/badge_gold.png';
									json.searchdata_tier_name = '골드';
								} else if(30 < myTotalRate && myTotalRate <= 70) {
									json.searchdata_tier_img = 'image/badge_silver.png';
									json.searchdata_tier_name = '실버';
								} else if(70 < myTotalRate) {
									json.searchdata_tier_img = 'image/badge_bronze.png';
									json.searchdata_tier_name = '브론즈';
								}
							}
			        	}
			        	res.render(path, json);
			        });
				}
			}
		});
	});
});

router.get('/my_page', need_login, readPredictionShortcutHTML, readFeedbackHTML, checkAttendancePoint, function(req, res) {
	var path = 'my_page.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		myEmail: req.session.email,
		myNickName: '-',
		signupDate: '-',
		headerHideMenu: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	json.prediction_shortcut = req.predictionShortcut;
	json.feedback = req.feedback;

	user.get(req.session.email, function(userData) {
		if(userData) {
			json.myNickName = userData.nickname;
			var signupDate = new Date(userData.signup_date);
			var year = signupDate.getFullYear();
			var month = signupDate.getMonth()+1;
			var day = signupDate.getDate();

			json.signupDate = year + '년 ' + month + '월 ' + day + '일';
			json.mainSport = getSportsName(userData.main_sport);
			json.mainLeague = getLeagueName(userData.main_league);
		}

		res.render(path, json);
	});
});

router.get('/underconstruction', readFeedbackHTML, function(req, res) {
	var path = 'under_construction.html';
	var json = {
		headerHideMenu: 'display:none;',
		login_display: 'display:none;',
		signup_display: 'display:none;',
		myinfo_display: 'display:none;',
		logout_display: 'display:none;',
		myCurrentPoint: 0
	};

	json.feedback = req.feedback;

	res.render(path, json);
});

module.exports = router;
