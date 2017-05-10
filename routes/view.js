var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();

var board = require('../core/board.js');
var user = require('../core/user.js');
var schedule = require('../core/schedule.js');

// 로그인 상태에서만 접속 가능한 페이지 체크
// router.get('/url', need_login, function(req, res) {}) 형식으로 사용
var need_login = function(req, res, next) {
	if (req.session.login) {
		next();
	} else {
		res.redirect('/');
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
	fs.readFile('./views/prediction_shortcut.html', function(err, data) {
		req.predictionShortcut = data;
		next();
	});
};

router.get('/', readPredictionShortcutHTML, function(req, res) {
	var path = 'index.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: ''
	};

	json.prediction_shortcut = req.predictionShortcut;

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	res.render(path, json);
});

router.get('/signup', no_login, function(req, res) {
	var path = 'signup.html';
	var json = {};

	res.render(path, json);
});

router.get('/login', no_login, function(req, res) {
	var path = 'login.html';
	var json = {};

	res.render(path, json);

});

router.get('/rank', readPredictionShortcutHTML, function(req, res) {
	var path = 'rank.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		rank_html: ''
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

    	var rank_array = [];

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
			console.log('rank_data' , data);
	        if(err) {
	            console.log("redis get rank err: ", err);
	            res.render(path, json);
	        } else {
	            async.mapSeries(data, function(info, async_cb) {
	                rank_array.push(info);
	                async_cb();
	            }, function(async_err) {
	            	user.get_rank_data(rank_array, function(userdata) {
	            		var rank_table_html = '';

	            		var get_tier_img = function(rating) {
							rating = parseInt(rating);

							if(rating < 1200) {
								return '<div><div class="rank_table_tier badge_bronze"></div><span class="table_tier_name">브론즈</span></div>';
							} else if(1200 <= rating && rating < 1400) {
								return '<div><div class="rank_table_tier badge_silver"></div><span class="table_tier_name">실버</span></div>';
							} else if(1400 <= rating && rating < 1600) {
								return '<div><div class="rank_table_tier badge_gold"></div><span class="table_tier_name">골드</span></div>';
							} else if(1600 <= rating && rating < 1800) {
								return '<div><div class="rank_table_tier badge_platinum"></div><span class="table_tier_name">플래티넘</span></div>';
							} else if(1800 <= rating) {
								return '<div><div class="rank_table_tier badge_diamond"></div><span class="table_tier_name">다이아</span></div>';
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

						var rank = 1;
						var type = 'total';
						if(req.query.type) {
							type = req.query.type;
						}

						async.mapSeries(userdata, function(user, _async_cb) {
							rank_table_html += '<tr id="' + (search_target == rank ? 'target_row' : '') + '">';
							rank_table_html += '<td>' + rank + '</td>';
							rank_table_html += '<td>' + user.nickname + '</td>';
							rank_table_html += '<td>' + get_league_name(user.main_league) + '</td>';
							rank_table_html += '<td>' + user.rating + '</td>';

							if(user.record) {
								if(user.record[type]) {
									rank_table_html += '<td>' + (user.record[type].hit || 0) + ' / ' + (user.record[type].fail || 0) + '</td>';
									if(!user.record[type].fail) {
										rank_table_html += '<td>-</td>';
									} else {
										rank_table_html += '<td>' + ((user.record[type].hit/(user.record[type].hit + user.record[type].fail))*100).toFixed(2) + '%</td>';
									}
								} else {
									rank_table_html += '<td>0 / 0</td>';
									rank_table_html += '<td>-</td>';
								}
							} else {
								rank_table_html += '<td>0 / 0</td>';
								rank_table_html += '<td>-</td>';
							}

							rank_table_html += '<td class="tier_cell left">' + get_tier_img(user.rating) + '</td>';
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

router.get('/board', readPredictionShortcutHTML, function(req, res) {
	var path = 'board.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		user_email: req.session.email
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

	res.render(path, json);
});

router.get('/board/write', need_login, readPredictionShortcutHTML, function(req, res) {
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
		write_btn_name: ''
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

router.get('/schedule', readPredictionShortcutHTML, function(req, res) {
	var path = 'schedule.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: ''
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

	res.render(path, json);
});
router.get('/chat/:matchId',function(req, res){
	var path = 'chat_client.html';
	var matchId = req.params.matchId;
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		my_nickname: req.session.nickname,
		matchId: req.params.matchId
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	schedule.getMatchTeamsName({
		'matchId': matchId
	}, function(result) {
		json.homeTeamName = result.homeTeamName;
		json.awayTeamName = result.awayTeamName;

        res.render(path, json);
	});
});

router.get('/search', readPredictionShortcutHTML, function(req, res) {
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

		myTotalRate: '-'
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
	}

	json.prediction_shortcut = req.predictionShortcut;

	user.countAllUsers(function(userCount) {
		user.get(id, function(userdata) {
			if(!userdata) {
				json.search_show = 'display:none;';
				res.render(path, json);
			} else {
				json.searchdata_user_id = userdata.nickname;

				var rating = userdata.rating;
				json.searchdata_rating = rating;

				if(userdata.readyGameCnt && userdata.readyGameCnt > 0) {
					json.searchdata_tier_img = 'image/badge_ready.png';
					json.searchdata_tier_name = '배치중';
				} else {
					if(rating < 1200) {
						json.searchdata_tier_img = 'image/badge_bronze.png';
						json.searchdata_tier_name = '브론즈';
					} else if(1200 <= rating && rating < 1400) {
						json.searchdata_tier_img = 'image/badge_silver.png';
						json.searchdata_tier_name = '실버';
					} else if(1400 <= rating && rating < 1600) {
						json.searchdata_tier_img = 'image/badge_gold.png';
						json.searchdata_tier_name = '골드';
					} else if(1600 <= rating && rating < 1800) {
						json.searchdata_tier_img = 'image/badge_platinum.png';
						json.searchdata_tier_name = '플래티넘';
					} else if(1800 <= rating) {
						json.searchdata_tier_img = 'image/badge_diamond.png';
						json.searchdata_tier_name = '다이아몬드';
					}
				}

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
			        		json.myTotalRate = (((data+1) / userCount)*100).toFixed(2);
			        	}
			        	res.render(path, json);
			        });
				}
			}
		});
	});
});

module.exports = router;
