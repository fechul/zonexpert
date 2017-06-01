var SCHEDULE = {
	init: function(initData) {
		this.init_events();
		this.get_schedule();

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
					location.href = "/";
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

		$('#header li.my_point > img').click(function() {
			location.href = '/my_page';
		});

		$('#header li.my_point > span').click(function() {
			location.href = '/my_page';
		});

		$('.scheduledata_league_btn button').click(function() {
			var $this_button = $(this);
			self.get_schedule($this_button.attr('key'), function() {
				$('.scheduledata_league_btn button').removeClass('active');
				$this_button.addClass('active');
			});
		});

		$('#schedule_table').on('click', '.schedule_table_row:not(.finished):not(.success):not(.failed):not(.confirmed) td.schedule_basket', function() {
			var row = $(this).closest('tr.schedule_table_row');
			var toggle = row.hasClass('basketed');

			$.ajax({
				'url': '/prediction/basket',
				'type': toggle ? 'DELETE' : 'POST',
				'data': {
					'matchId': row.data('matchId'),
					'leagueId': row.data('leagueId')
				},
				'dataType': 'json',
				'success': function(result) {
					if (result) {
						if (row.hasClass('basketed')) {
							row.removeClass('basketed');
						} else {
							row.addClass('basketed');
						}

						row.data('toggle', !toggle);
						PREDICTION_SHORTCUT.setData();
						$('.prediction_shortcut_button_container').eq(0).animate({right: '+=3px'}, 40)
																		.animate({right: '-=6px'}, 40)
																		.animate({right: '+=6px'}, 40)
																		.animate({right: '-=6px'}, 40)
																		.animate({right: '+=6px'}, 40)
																		.animate({right: '-=3px'}, 40);
					} else {
						console.log('err');
					}

				}
			});
		});

		$('#schedule_table').on('click', '.schedule_table_row td:not(:nth-child(1)):not(:nth-child(7))', function() {
			location.href = '/match/' + $(this).closest('.schedule_table_row').data('matchId');
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
	},

	getDateString: function(date) {
		var dayArr = ['일', '월', '화', '수', '목', '금', '토'];
		date = new Date(date);
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = dayArr[date.getDay()];
		var _date = date.getDate();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		month = month >= 10 ? month : '0' + month
		_date = _date >= 10 ? _date : '0' + _date;
		hours = hours >= 10 ? hours : '0' + hours;
		minutes = minutes >= 10 ? minutes : '0' + minutes;

		var dateString = month + '.' + _date + ' (' + day + ')' + '<br>' + hours + ':' + minutes;

		return dateString;
	},

	getStatusString: function(status) {
		var str = '';

		if (status == 'FINISHED') {
			str = '종료';
		// } else if (status == 'POSTPONED') {
		// 	str = '연기';
		} else if (status == 'IN_PLAY') {
			str = '경기중';
		} else if (status == 'DELAYED') {
			str = '지연';
		} else {
			str = '경기전';
		}

		return str;
	},

	get_schedule: function(leagueId, callback) {
		var self = this;
		leagueId = leagueId || $('.league_btn.active').eq(0).attr('key');

		$.get('/prediction/all', {
			'leagueId': leagueId
		}, function(baskets) {
			baskets = JSON.parse(baskets);
			var basketIdList = [];
			for (var i in baskets) {
				basketIdList.push(baskets[i].matchId);
			}

			$.get('/schedule/league', {
				'leagueId': leagueId
			}, function(matches) {
				$('#schedule_table').empty();

				for (var i in matches) {
					var match = matches[i];
					var currentDate = new Date();
					var finished = '';
					var resultFlag = '';

					if ((new Date(match.date)) < currentDate) {
						finished = 'finished';
					}

					if (basketIdList.indexOf(match.id) > -1) {
						resultFlag = 'basketed';

						if (baskets[basketIdList.indexOf(match.id)].confirmed == true) {
							resultFlag = 'confirmed';

							if (baskets[basketIdList.indexOf(match.id)].result == 'true') {
								resultFlag = 'success';
							} else if (baskets[basketIdList.indexOf(match.id)].result == 'false') {
								resultFlag = 'failed';
							}
						}
					}


					$('#schedule_table').append([
						'<tr class="schedule_table_row ', finished, ' ', resultFlag, '">',
							'<td class="schedule_date">', self.getDateString(match.date), '</td>',
							'<td class="schedule_home_team_name">', match.homeTeamName, '</td>',
							'<td class="schedule_home_team_score">', match.result && Number.isInteger(match.result.goalsHomeTeam) ? match.result.goalsHomeTeam : '-', '</td>',
							'<td class="schedule_status">', self.getStatusString(match.status), '</td>',
							'<td class="schedule_away_team_score">', match.result && Number.isInteger(match.result.goalsAwayTeam) ? match.result.goalsAwayTeam : '-', '</td>',
							'<td class="schedule_away_team_name">', match.awayTeamName, '</td>',
							'<td class="schedule_basket"><span><i class="fa fa-check-square-o"></i></span></td>',
						'</tr>'
					].join(''));

					$('#schedule_table .schedule_table_row').last().data('matchId', match.id);
					$('#schedule_table .schedule_table_row').last().data('leagueId', match.leagueId);
				}

				$(document).ready(function() {
					// $('body').animate({'scrollTop': $('#schedule_table tr .schedule_basket_toggle:not(.disable)').first().offset().top - window.innerHeight / 2}, 800);
				});

				if (callback && typeof(callback) == 'function') {
					callback();
				}
			});
		});
	}
};
