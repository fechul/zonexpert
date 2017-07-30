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

var checkPoint = function(req, res, next) {
	if(req.session.login) {
		user.checkPoint(req.session.email, function(pointData) {
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
		case 'k-league':
			return 'K리그';
			break;
		default:
			return '-';
			break;
	}
}

router.get('/', readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res) {
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
		myCurrentPoint: req.point,
		mobileSafaribodyBackgroundCss: ''
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

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
		myCurrentPoint: 0,
		mobileSafaribodyBackgroundCss: ''
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

	json.feedback = req.feedback;

	res.render(path, json);
});

router.get('/signup_complete', function(req, res) {
	var path = 'signup_complete.html';

	res.render(path);
});

router.get('/login', no_login, readFeedbackHTML, function(req, res) {
	var path = 'login.html';
	var json = {
		headerHideMenu: 'display:none;',
		login_display: 'display:none;',
		signup_display: 'display:none;',
		myinfo_display: 'display:none;',
		logout_display: 'display:none;',
		myCurrentPoint: 0,
		mobileSafaribodyBackgroundCss: ''
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

	json.feedback = req.feedback;

	res.render(path, json);

});

router.get('/rank', readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res) {
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
		myCurrentPoint: req.point,
		mobileSafaribodyBackgroundCss: '',
		pageNo: req.query.pageNo || 1,
		totalPage: 1
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	var limit = 50;
	var skip = (req.query.pageNo ? (Math.floor(req.query.pageNo/limit))*limit :  0);

	var key = 'rating_rank';
	// var key = 'game_cnt_rank';
	// var key = 'predict_rate_rank';

	var get_rank_range = function(start, search_target) {
    	var end = start + (limit-1);

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
            		json.totalPage = Math.ceil((userCount/limit));
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

						var rank = start+1;
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
									if(user.record[type].hit + user.record[type].fail > 0) {
										rank_table_html += '<td class="table_label_hitrate">' + ((user.record[type].hit/(user.record[type].hit + user.record[type].fail))*100).toFixed(2) + '%</td>';
									} else {
										rank_table_html += '<td class="table_label_hitrate">-</td>';
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
						var pageNo = Math.ceil(target_rank/limit);
						json.pageNo = pageNo;
						var startIdx = (pageNo*limit)-(limit-1);
						get_rank_range(startIdx, target_rank);
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
		var startIdx = (req.query.pageNo*limit)-(limit-1) || 1;
		get_rank_range(startIdx, null);
	}
});

router.get('/board', readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res) {
	var path = 'board.html';
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
		myCurrentPoint: req.point,
		isLogin: false,
		mobileSafaribodyBackgroundCss: '',
		pageNo: req.query.pageNo || 1
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
		json.isLogin = true;
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}


	json.prediction_shortcut = req.predictionShortcut;
	json.feedback = req.feedback;

    res.render(path, json);

});

router.get('/board/read', readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res) {
	var boardNo = req.query.no;
	var path = 'board_read.html';

	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		headerHideMenu: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point,
		mobileSafaribodyBackgroundCss: '',

		boardNo: (boardNo || -1),
		board_title: '',
		board_content: '',
		writer: '',
		writerBadge: 'ready',
		writeDate: null,
		toolDisplay: 'display:none;',
		iLike: '',

		url: __url
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

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

	board.get({
		'myEmail': req.session.email,
		'boardNo': boardNo
	}, function(boardData) {
		if(boardData) {
			json.board_title = boardData.title;
			json.board_content = boardData.content;
			json.writer = boardData.nickname;

			if(boardData.i_like) {
				json.iLike = 'my_like';
			}
			if(req.session) {
				if(boardData.writer == req.session.email) {
					json.toolDisplay = '';
				}
			}

			var wd = boardData.date;
			var wd_year = wd.getFullYear();
			var wd_month = wd.getMonth() + 1;
			var wd_date = wd.getDate();
			var wd_hour = wd.getHours();
			var wd_min = wd.getMinutes();
			var wd_sec = wd.getSeconds();

			if(wd_month < 10) {
				wd_month = '0' + wd_month;
			}
			if(wd_date < 10) {
				wd_date = '0' + wd_date;
			}
			if(wd_hour < 10) {
				wd_hour = '0' + wd_hour;
			}
			if(wd_min < 10) {
				wd_min = '0' + wd_min;
			}
			if(wd_sec < 10) {
				wd_sec = '0' + wd_sec;
			}
			json.writeDate = wd_year + '/' + wd_month + '/' + wd_date + ' ' + wd_hour + ':' + wd_min + ':' + wd_sec;

			user.countAllUsers('onlyRanked', function(userCount) {
				redis_client.zrevrank('rating_rank', boardData.writer, function(err, data) {
		        	if(!err) {
		        		var myRank = data+1;
		        		var myTotalRate = ((myRank / userCount)*100).toFixed(2);

		        		if(boardData.readyGameCnt && boardData.readyGameCnt > 0) {
								json.writerBadge = 'ready';
						} else {
							if(myTotalRate <= 3) {
								json.writerBadge = 'diamond';
							} else if(3 < myTotalRate && myTotalRate <= 10) {
								json.writerBadge = 'platinum';
							} else if(10 < myTotalRate && myTotalRate <= 30) {
								json.writerBadge = 'gold';
							} else if(30 < myTotalRate && myTotalRate <= 70) {
								json.writerBadge = 'silver';
							} else if(70 < myTotalRate) {
								json.writerBadge = 'bronze';
							}
						}
		        	}
		        	res.render(path, json);
		        });
			});
		} else {
			res.redirect('/board');
		}
	});
});

router.get('/board/write', need_login, readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res) {
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
		myCurrentPoint: req.point,
		mobileSafaribodyBackgroundCss: ''
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

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

router.get('/schedule', readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res) {
	var path = 'schedule.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		headerHideMenu: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point,
		targetMatch: req.query.move || '',
		mobileSafaribodyBackgroundCss: ''
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

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

router.get('/match/:matchId', readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res){
	var path = 'chat_client.html';
	var matchId = req.params.matchId;
	var viewTargetNick = req.query.viewTargetNick;

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
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point,
		myEmail: '',
		viewTargetNick: null,
		mobileSafaribodyBackgroundCss: ''
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
		json.myEmail = req.session.email;
		if(viewTargetNick) {
			json.viewTargetNick = viewTargetNick;
		}
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	json.predictionSystemPick = '';
	json.predictionSystemDetail = JSON.stringify([]);

	schedule.getMatch({
		'matchId': matchId
	}, function(matchData) {
		// matchData.roomOpen = true;	//test
		if (matchData && (matchData.status != 'FINISHED') && (matchData.status != 'POSTPONED') && (matchData.status != 'POSTPONED_RAIN')) {
			if (matchData.result) {
				json.goalsHomeTeam = matchData.result.goalsHomeTeam == null ? '-' : matchData.result.goalsHomeTeam;
				json.goalsAwayTeam = matchData.result.goalsAwayTeam == null ? '-' : matchData.result.goalsAwayTeam;
			}

			if (matchData.status == 'IN_PLAY') {
				json.chatMatchStatus = '<span class="status_live">LIVE</span>';
			} else if (matchData.status == 'FINISHED') {
				json.chatMatchStatus = '종료';
			} else {
				json.chatMatchStatus = '예정';
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

			if(req.session.login) {
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

										if (matchData.systemViewList.indexOf(req.session.email) > -1) {
											user.getPredictSystemData({
												'matchId': matchData.id,
												'leagueId': matchData.leagueId,
												'sportsId': matchData.sportsId
											}, function(systemData) {
												if (systemData.result) {
													json.predictionSystemPick = systemData.pick;
													json.predictionSystemDetail = JSON.stringify(systemData.detail);
												}

								        		res.render(path, json);
											});
										} else {
							        		res.render(path, json);
										}
									});
								});
					        });
						});
					} else {
						res.redirect('/schedule');
					}
				});
			} else {
				res.redirect('/login');
			}

		} else {
			res.redirect('/schedule');
		}
	});
});

router.get('/search', readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res) {
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
		myCurrentPoint: req.point,
		myNickName: '',
		isReady: false,
		mobileSafaribodyBackgroundCss: ''
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
		json.myNickName = req.session.nickname;
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

				json.searchdata_predict_rate = (total_hit == 0 ? 0 : ((total_hit/(total_hit + total_fail))*100).toFixed(2));

				json.no_search_show = 'display:none;';

				var key = 'rating_rank';

				if(userdata.readyGameCnt && userdata.readyGameCnt > 0) {
					json.searchdata_tier_img = 'image/badge_ready.png';
					json.searchdata_tier_name = '배치중';
	        		json.searchdata_rank = '-';
	        		json.myTotalRate = '-';
	        		json.searchdata_rating = '배치중';
	        		json.isReady = true;
		        	res.render(path, json);
				} else {
					json.searchdata_rating = parseInt(rating, 10) + '점';
					redis_client.zrevrank(key, userdata.email, function(err, data) {
			        	if(!err) {
			        		json.searchdata_rank = data+1;
			        		var myTotalRate = (((data+1) / userCount)*100).toFixed(2);
			        		json.myTotalRate = myTotalRate;

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
			        	res.render(path, json);
			        });
				}
			}
		});
	});
});

router.get('/my_page', need_login, readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res) {
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
		myCurrentPoint: req.point,
		mobileSafaribodyBackgroundCss: '',
		myFreePoint: 0,
		myChargePoint: 0,
		useHtml: '',
		earnHtml: '',
		chargeHtml: '',
		useShow: '',
		earnShow: '',
		chargeShow: '',
		useCnt: 0,
		earnCnt: 0,
		useAmount: 0,
		earnAmount: 0
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

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

	var getNickname = function(email, callback) {
		user.get_nickname(email, function(nickname) {
			callback(nickname);
		});
	};

	user.get(req.session.email, function(userData) {
		if(userData) {
			json.myNickName = userData.nickname;
			json.myFreePoint = userData.freePoint;
			json.myChargePoint = userData.point;
			var signupDate = new Date(userData.signup_date);
			var year = signupDate.getFullYear();
			var month = signupDate.getMonth()+1;
			var day = signupDate.getDate();

			json.signupDate = year + '년 ' + month + '월 ' + day + '일';
			json.mainSport = getSportsName(userData.main_sport);
			json.mainLeague = getLeagueName(userData.main_league);
		}

		if(userData.pointLog && userData.pointLog.length) {
			async.mapSeries(userData.pointLog, function(log, async_cb) {
				var time = log.time;
				var year = time.getFullYear();
				var month = (time.getMonth() < 10 ? '0' + (time.getMonth()+1) : (time.getMonth()+1));
				var day = (time.getDate() < 10 ? '0' + time.getDate() : time.getDate());

				if(log.classification == 'charge' || log.classification == 'attendance') {
					json.chargeHtml += '<tr>';
					json.chargeHtml += '<td>' + year + '/' + month + '/' + day + '</td>';
					json.chargeHtml += '<td>' + (log.pointType == 'free' ? '무료' : '충전') + (log.classification == 'attendance' ? '(출석 포인트)' : '') + '</td>';
					json.chargeHtml += '<td><span style="color:#2d9e27;">+' + log.amount + '</span></td>';
					json.chargeHtml += '</tr>';
					async_cb();
				} else if(log.classification == 'use') {
					getNickname(log.target, function(targetNick) {
						if (targetNick == null) {
							targetNick = '-';
						}
						schedule.getTeamsInfo({
							'matchId': log.matchId
						}, function(teamsInfo) {
							json.useHtml += '<tr>';
							json.useHtml += '<td>' + year + '/' + month + '/' + day + '</td>';
							json.useHtml += '<td>' + (log.useClassification == 'view' ? '사용자 조회' : '예측시스템 조회') + '</td>';
							json.useHtml += '<td class="listMatch"><img src="' + teamsInfo.homeTeamImg + '"></img>' + teamsInfo.homeTeamName + ' <span class="versus">vs</span> <img src="' + teamsInfo.awayTeamImg + '"></img>' + teamsInfo.awayTeamName + '</td>';
							json.useHtml += '<td>' + targetNick || '-' + '</td>';
							json.useHtml += '<td><span style="color:#e60b0b;">-' + log.amount + '</span><br>' + (log.pointType == 'free' ? '(무료포인트)' : '(충전포인트)') + '</td>';
							json.useHtml += '</tr>';
							json.useCnt++;
							json.useAmount += log.amount;
							async_cb();
						});
					});
				} else if(log.classification == 'earn') {
					getNickname(log.target, function(targetNick) {
						if (targetNick == null) {
							targetNick = '-';
						}
						schedule.getTeamsInfo({
							'matchId': log.matchId
						}, function(teamsInfo) {
							json.earnHtml += '<tr>';
							json.earnHtml += '<td>' + year + '/' + month + '/' + day + '</td>';
							json.earnHtml += '<td class="listMatch"><img src="' + teamsInfo.homeTeamImg + '"></img>' + teamsInfo.homeTeamName + ' <span class="versus">vs</span> <img src="' + teamsInfo.awayTeamImg + '"></img>' + teamsInfo.awayTeamName + '</td>';
							json.earnHtml += '<td>' + targetNick + '</td>';
							json.earnHtml += '<td><span style="color:#2d9e27;">+' + log.amount + '</span><br>' + (log.pointType == 'free' ? '(무료포인트)' : '(충전포인트)') + '</td>';
							json.earnHtml += '</tr>';
							json.earnCnt++;
							json.earnAmount += log.amount;
							async_cb();
						});
					});
				} else {
					async_cb();
				}

			}, function(async_err) {
				if(json.useHtml.length) {
					json.useShow = 'display:none;';
				}
				if(json.earnHtml.length) {
					json.earnShow = 'display:none;';
				}
				if(json.chargeHtml.length) {
					json.chargeShow = 'display:none;';
				}
				res.render(path, json);
			});
		} else {
			res.render(path, json);
		}
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

router.get('/help', readPredictionShortcutHTML, readFeedbackHTML, checkPoint, function(req, res) {
	var path = 'help.html';
	if (req.is_mobile) {
		path = 'm_help.html';
	}

	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		rank_html: '',
		headerHideMenu: '',
		attendancePointUpdated: req.attendancePointUpdated,
		myCurrentPoint: req.point,
		mobileSafaribodyBackgroundCss: ''
	};

	if (req.is_mobile_safari) {
		json.mobileSafaribodyBackgroundCss = 'style="background-size: 100% 100% !important;"';
	}

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

module.exports = router;
