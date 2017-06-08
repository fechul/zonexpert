var SCHEDULE = {
	initFlag: true,
	init: function(initData) {
		this.targetMatch = initData.targetMatch;
		var leagueId = '';
		if (this.initFlag) {
			this.initFlag = false;
			var lastSportsId = localStorage.getItem('zeslaSI');
			var lastLeagueId = localStorage.getItem('zeslaLI');

			if (lastSportsId) {
				$('.scheduledata_league_select_btn_container button').removeClass('active');
				$('.scheduledata_league_select_btn_container button[key="' + lastSportsId + '"]').addClass('active');

				$('.scheduledata_league_btn_container').hide();
				$('.scheduledata_league_btn_container[sports="' + lastSportsId + '"]').show();

				$('.league_btn').removeClass('active');
				if (lastLeagueId) {
					$('.league_btn[key="' + lastLeagueId + '"]').addClass('active');
					leagueId = lastLeagueId;
				} else {
					$('.scheduledata_league_btn_container[sports="' + lastSportsId + '"] .league_btn').eq(0).addClass('active');
					leagueId = $('.scheduledata_league_btn_container[sports="' + lastSportsId + '"] .league_btn').eq(0).attr('key');
				}
			} else {
				$('.scheduledata_league_select_btn_container button').eq(0).addClass('active');
				if (lastLeagueId) {
					$('.league_btn[key="' + lastLeagueId + '"]').addClass('active');
					leagueId = lastLeagueId;
				} else {
					$('.scheduledata_league_btn_container').eq(0).find('.league_btn').eq(0).addClass('active');
					leagueId = $('.scheduledata_league_btn_container').eq(0).find('.league_btn').eq(0).attr('key');
				}
			}
		}

		this.init_events();
		this.get_schedule(leagueId);

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

		$('.scheduledata_league_btn_container button').click(function() {
			var $this_button = $(this);
			$('.scheduledata_league_btn_container button').removeClass('active');
			$this_button.addClass('active');

			var leagueId = $this_button.attr('key');

			localStorage.setItem('zeslaLI', leagueId);
			self.get_schedule(leagueId, function() {
			});
		});

		$('.scheduledata_league_select_btn_container button').click(function() {
			$('.scheduledata_league_select_btn_container button').removeClass('active');
			$(this).addClass('active');
			var sportsId = $(this).attr('key');

			$('.scheduledata_league_btn_container:not([sports=' + sportsId + '])').hide();
			$('.scheduledata_league_btn_container[sports=' + sportsId + ']').show();
			$('.scheduledata_league_btn_container[sports=' + sportsId + ']').find('button').eq(0).click();

			localStorage.setItem('zeslaSI', sportsId);
		});

		$('#schedule_table').on('click', '.schedule_table_row:not(.finished):not(.success):not(.failed):not(.confirmed):not(.notyet) td.schedule_basket', function() {
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
						if(result.result) {
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
							if(result.err_code == 1) {
								notice.show('alert', '지난 경기는 예측할 수 없습니다.');
							} else if(result.err_code == 2) {
								notice.show('alert', '경기 시작 5일 이내의 경기만 예측할 수 있습니다.');
							} else {
								notice.show('alert', '실패했습니다. 잠시 후 다시 시도해주세요.');
							}
						}
					} else {
						notice.show('alert', '로그인 해주세요');
					}

				}
			});
		});

		$('#schedule_table').on('click', '.schedule_table_row td:not(:nth-child(1)):not(:nth-child(7))', function() {
			var status = $(this).parent('tr').data('status');
			if(status == 'FINISHED' || status == 'POSTPONED' || status == 'POSTPONED_RAIN') {
				notice.show('alert', '진행중이거나 예정된 경기만 들어갈 수 있습니다.');
				return false;
			} else if(status == 'NOT_YET') {
				notice.show('alert', '경기 시작 5일 이내의 경기만 들어갈 수 있습니다.');
				return false;
			} else {
				location.href = '/match/' + $(this).closest('.schedule_table_row').data('matchId');
			}
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

		$('#schedule_month_select').change(function() {
			$('.schedule_table_row:not([month=' + $(this).val() + '])').hide();
			$('.schedule_table_row[month=' + $(this).val() + ']').show();
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
		} else if (status == 'IN_PLAY') {
			str = '<span class="status_live">LIVE</span>';
		} else if (status == 'DELAYED') {
			str = '지연';
		} else if (status == 'POSTPONED') {
			str = '연기';
		} else if (status == 'POSTPONED_RAIN') {
			str = '우천<br>취소';
		} else {
			str = '예정';
		}

		return str;
	},

	get_schedule: function(leagueId, callback) {
		var self = this;
		leagueId = leagueId || $('.league_btn.active').eq(0).attr('key');
		var currentDate = new Date();
		var currentYear = currentDate.getFullYear();
		var currentMonth = currentDate.getMonth() + 1;
		var currentDay = currentDate.getDate();
		var monthList = [];
		var todayCount = 0;
		var prevDay = 0;
		var fiveDaysLater = currentYear + '-' + currentMonth + '-' + (currentDay+5);
        fiveDaysLater = new Date(fiveDaysLater);

		var isInteger = function(num) {
			return (num ^ 0) === num;
		};

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
				$('#schedule_month_select').empty();

				for (var i in matches) {
					var match = matches[i];
					var finished = '';
					var resultFlag = '';
					var isFiveDaysLater = '';

					var matchDate = new Date(match.date);
					var matchYear = matchDate.getFullYear();
					var matchMonth = matchDate.getMonth() + 1;
					var matchDay = matchDate.getDate();

					if(matchDate >= fiveDaysLater) {
						isFiveDaysLater = 'notyet';
					}

					if (monthList.indexOf(matchMonth) == -1) {
						monthList.push(matchMonth);

						var monthString = matchMonth;
						if (matchMonth < 10) {
							monthString = '0' + matchMonth;
						}

						$('#schedule_month_select').append([
							'<option value=', matchMonth, ' ', (matchMonth == currentMonth ? 'selected' : ''), '>',
								matchYear, '.', monthString,
							'</option>'
						].join(''));
					}

					if (matchDate < currentDate) {
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

					var today = ''
					if ((matchDay == currentDay) && (matchMonth == currentMonth) && (matchYear == currentDate.getFullYear())) {
						if (todayCount == 0) {
							today = 'today-first';
						} else {
							today = 'today';
						}
						todayCount++;
					} else {
						if (todayCount > 0) {
							$('#schedule_table .schedule_table_row').last().removeClass('today').addClass('today-last');
							todayCount = 0;
						}
					}

					var changeDay = '';

					if (prevDay != matchDay) {
						changeDay = 'changeDay';
						prevDay = matchDay;
					}

					var row_data = [
						'<tr matchId="', match.id ,'" class="schedule_table_row ', finished, ' ', resultFlag, ' ', today, ' ', changeDay, ' ', isFiveDaysLater, '" month="', matchMonth, '">',
							'<td class="schedule_date">', self.getDateString(match.date), '</td>'
					].join('');

					var homeResult = '';
					var awayResult = '';

					if ((match.status == 'FINISHED') && match.result) {
						if (match.result.goalsHomeTeam > match.result.goalsAwayTeam) {
							homeResult = 'win';
							awayResult = 'lose';
						} else if (match.result.goalsHomeTeam < match.result.goalsAwayTeam) {
							homeResult = 'lose';
							awayResult = 'win';
						} else {
							homeResult = 'draw';
							awayResult = 'draw';
						}
					}

					row_data += [
						'<td class="schedule_home_team_name">', match.homeTeamName, '</td>',
						'<td class="schedule_home_team_score ', homeResult, '">', (match.status == 'FINISHED') || (match.status == 'IN_PLAY') ? (match.result && isInteger(match.result.goalsHomeTeam) ? match.result.goalsHomeTeam : 0) : '-', '</td>',
						'<td class="schedule_status">', self.getStatusString(match.status), '</td>',
						'<td class="schedule_away_team_score ', awayResult, '">', (match.status == 'FINISHED') || (match.status == 'IN_PLAY') ? (match.result && isInteger(match.result.goalsAwayTeam) ? match.result.goalsAwayTeam : 0) : '-', '</td>',
						'<td class="schedule_away_team_name">', match.awayTeamName, '</td>',
					].join('');

					row_data += [
							'<td class="schedule_basket"><span><i class="fa fa-check-square-o"></i></span></td>',
						'</tr>'
					].join('');

					$('#schedule_table').append(row_data);

					if(isFiveDaysLater == 'notyet') {
						match.status = 'NOT_YET';
					}

					$('#schedule_table .schedule_table_row').last().data('matchId', match.id);
					$('#schedule_table .schedule_table_row').last().data('leagueId', match.leagueId);
					$('#schedule_table .schedule_table_row').last().data('status', match.status);
				}

				$(document).ready(function() {
					if(self.targetMatch && self.targetMatch.length) {
						if($('#schedule_table tr.schedule_table_row[matchId="' + self.targetMatch + '"]').length) {
							$('body').animate({'scrollTop': $('#schedule_table tr.schedule_table_row[matchId="' + self.targetMatch + '"]').first().offset().top - window.innerHeight / 2}, 800);
						}
					} else {
						if ($('#schedule_table tr.schedule_table_row.today-first').length) {
							$('body').animate({'scrollTop': $('#schedule_table tr.schedule_table_row.today-first').first().offset().top - window.innerHeight / 2}, 800);
						}
					}
				});

				if($('#schedule_month_select option[selected]').length) {
					$('#schedule_month_select').val($('#schedule_month_select option[selected]').eq(0).attr('value')).change();
				} else {
					$('#schedule_month_select').val($('#schedule_month_select option').last().attr('value')).change();
				}

				if (callback && typeof(callback) == 'function') {
					callback();
				}
			});
		});
	}
};
