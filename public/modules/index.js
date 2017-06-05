var INDEX = {
	init: function(initData) {
		this.myNickName = initData.myNickName;

		this.init_events();
		this.set_mydata();
		this.setRecentPredict();
		this.set_rank('rating');

		notice.init();

		if(initData.attendancePointUpdated) {
			notice.show('success', '100점의 출석 포인트가 적립되었습니다.');
		}
	},

	init_events: function() {
		var self = this;

		$('#header .tools .signup').click(function() {
			location.href = "/signup";
		});

		$('#header .tools .login').click(function() {
			location.href = "/login";
		});

		$('#header .tools .logout').click(function() {
			$.post('/logout', {}, function(logout) {
				if (logout.result) {
					location.reload();
				} else {
					console.log(logout);
				}
			});
		});

		$('#header .tools .my_page').click(function() {
			location.href = '/my_page';
		});

		$('#header .main_menu li').click(function() {
			var move = $(this).attr('move');
			location.href = '/' + move;
		});

		$('.rankdata_type_btn > button').click(function() {
			$('.rankdata_type_btn > button.active').removeClass('active');
			$(this).addClass('active');

			var type = $(this).attr('type');
			self.set_rank(type);
		});

		$('.user_search_input').keydown(function(e) {
			if(e.keyCode == 13) {
				$('.user_search_btn').click();
			}
		});

		$('.user_search_btn').click(function() {
			var id = $('.user_search_input').val();

			location.href = "/search?id=" + id;
		});

		$('#rank_table').on('click', 'tr:not(:nth-child(1))', function() {
			var $this = $(this);
			location.href = '/search?id=' + $this.find('td.table_label_nickname').html()
		});

		$('#searchMyData').click(function() {
			location.href = '/search?id=' + self.myNickName;
		});
	},

	set_mydata: function() {
		$.get('/getMyData', function(data) {
			if(data) {
				$('.mydata_user_id').html(data.mydata_user_id);
				$('.mydata_user_main_field').html(data.mydata_user_main_field);
				$('#my_tier_img').attr('src', data.my_tier_img);
				$('#my_rating').html(isNaN(data.my_rating) ? data.my_rating : parseInt(data.my_rating, 10) + '점');
				$('#my_tier_name').html(data.my_tier_name);
				$('#my_total_hit').html(data.my_total_hit);
				$('#my_total_fail').html(data.my_total_fail);
				$('#my_predict_rate').html(data.my_predict_rate);
			}
		});
	},

	setRecentPredict: function() {
		$.get('/getMyRecentPredict', function(data) {
			if(data && data.length) {
				$('.predict_content_row.no_data').hide();

				var recentPredictHtml = '';

				for(var i = 0; i < data.length; i++) {
					data[i].date = new Date(data[i].date);
					var year = data[i].date.getFullYear()%100;
					var month = data[i].date.getMonth()+1;
					if(month < 10) {
						month = '0' + month;
					}
					var day = data[i].date.getDate();
					if(day < 10) {
						day = '0' + day;
					}
					recentPredictHtml += '<div class="predict_content_row">';
					recentPredictHtml += '<div class="predict_date">' + year + '/' + month + '/' + day + '</div>';
					recentPredictHtml += '<div class="match_result"><span class="match_result_team">' + data[i].homeTeamName + '</span><span class="match_result_score">' + data[i].homeTeamGoals +  ' : ' +  data[i].awayTeamGoals + '</span><span class="match_result_team">' + data[i].awayTeamName + '</span></div>';
					if(data[i].predictResult == 'true') {
						recentPredictHtml += '<div class="predict_result success">성공</div>';
					} else {
						recentPredictHtml += '<div class="predict_result fail">실패</div>';
					}
					recentPredictHtml += '</div>';
				}
				$('.mydata_recent_predict_content').append(recentPredictHtml);
			} else {
				$('.predict_content_row.no_data').show();
			}
		});
	},

	set_rank: function(type) {
		var table_html = '';

		var get_tier_img = function(myTotalRate) {
			myTotalRate = parseFloat(myTotalRate);

			if(myTotalRate <= 3) {
				return '<div><div class="rank_table_tier badge_diamond"></div></div>';
			} else if(3 < myTotalRate && myTotalRate <= 10) {
				return '<div><div class="rank_table_tier badge_platinum"></div></div>';
			} else if(10 < myTotalRate && myTotalRate <= 30) {
				return '<div><div class="rank_table_tier badge_gold"></div></div>';
			} else if(30 < myTotalRate && myTotalRate <= 70) {
				return '<div><div class="rank_table_tier badge_silver"></div></div>';
			} else if(70 < myTotalRate) {
				return '<div><div class="rank_table_tier badge_bronze"></div></div>';
			} else {
				return '';
			}
		};

		var get_sport_name = function(code) {
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
		};

		var get_league_name = function(code) {
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

		var user_agent = navigator.userAgent;
		var isMobile = false;

		if (/mobile/i.test(user_agent) || /android/i.test(user_agent)) {
			isMobile = true;
		}

		$.get('/getTopTen', {
			'type': type
		}, function(data) {
			if(data && data.length) {
				for(var i = 0; i < data.length; i++) {
					table_html += '<tr>';
					table_html += '<td class="table_label_rank">' + (i+1) + '</td>';
					table_html += '<td class="table_label_nickname">' + data[i].nickname + '</td>';
					table_html += '<td class="table_label_mainsport">' + get_sport_name(data[i].main_sport) + '/' + get_league_name(data[i].main_league) + '</td>';
					table_html += '<td class="table_label_score">' + parseInt(data[i].rating, 10) + '</td>';

					if(data[i].record) {
						if(data[i].record.total) {
							table_html += '<td class="table_label_record">' + (data[i].record.total.hit || 0) + ' / ' + (data[i].record.total.fail || 0) + '</td>';
							if(!data[i].record.total.fail) {
								table_html += '<td class="table_label_hitrate">-</td>';
							} else {
								table_html += '<td class="table_label_hitrate">' + ((data[i].record.total.hit/(data[i].record.total.hit + data[i].record.total.fail))*100).toFixed(2) + '%</td>';
							}
						} else {
							table_html += '<td class="table_label_record">0 / 0</td>';
							table_html += '<td class="table_label_hitrate">-</td>';
						}
					} else {
						table_html += '<td class="table_label_record">0 / 0</td>';
						table_html += '<td class="table_label_hitrate">-</td>';
					}

					table_html += '<td class="tier_cell table_label_tier">' + (data[i].readyGameCnt && data[i].readyGameCnt > 0 ? '<div><div class="rank_table_tier badge_ready"></div></div>' : get_tier_img(data[i].myTotalRate)) + '</td>';
					table_html += '</tr>';
				}
			} else {
				table_html += '<tr><td colspan="7">데이터가 없습니다.</td></tr>'
			}
			$('#rank_table > tbody > tr:not(:first-child)').remove();
			$('#rank_table').append(table_html);

			if(isMobile) {
				$('.table_label_mainsport').hide();
				if(type == 'rating') {
					$('.table_label_score').show();
					$('.table_label_record').hide();
					$('.table_label_hitrate').hide();
				} else if(type == 'game_cnt') {
					$('.table_label_record').show();
					$('.table_label_score').hide();
					$('.table_label_hitrate').hide();
				} else if(type == 'predict_rate') {
					$('.table_label_hitrate').show();
					$('.table_label_score').hide();
					$('.table_label_record').hide();
				}
			} else {
				$('.table_label_mainsport').show();
				$('.table_label_score').show();
				$('.table_label_record').show();
				$('.table_label_hitrate').show();
			}
		});
	}
};
