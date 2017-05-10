var SCHEDULE = {
	init: function() {
		this.init_events();
		this.get_schedule();
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
			//마이페이지
		});

		$('#header .main_menu li').click(function() {
			var move = $(this).attr('move');
			location.href = '/' + move;
		});

		$('.scheduledata_league_btn button').click(function() {
			var $this_button = $(this);
			self.get_schedule($this_button.attr('key'), function() {
				$('.scheduledata_league_btn button').removeClass('active');
				$this_button.addClass('active');
			});
		});

		$('#schedule_table').on('click', 'td.schedule_basket_toggle:not(.disable) i', function() {
			var $this = $(this);
			var row = $(this).closest('tr');
			var toggle = row.data('toggle');

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
						row.data('toggle', !toggle);
						$this.removeClass('fa-toggle-' + (toggle ? 'on' : 'off')).addClass('fa-toggle-' + (toggle ? 'off' : 'on'));
						PREDICTION_SHORTCUT.getBaskets();
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

		$('#schedule_table').on('click', 'td.schedule_chatting i', function() {
			location.href = '/chat/' + $(this).closest('tr').data('matchId');
		});

		$('#schedule_table').on('click', 'td.schedule_chatting', function() {
			console.log('go chatting');
		});

		$('.tools .user_search_input').keydown(function(e) {
			if(e.keyCode == 13) {
				$('.tools .user_search_btn').click();
			}
		});

		$('.tools .user_search_btn').click(function() {
			var id = $('.tools .user_search_input').val();

			location.href = "/search?id=" + id;
		});
	},

	getDateString: function(date) {
		date = new Date(date);
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		month = month >= 10 ? month : '0' + month
		day = day >= 10 ? day : '0' + day;
		hours = hours >= 10 ? hours : '0' + hours;
		minutes = minutes >= 10 ? minutes : '0' + minutes;

		var dateString = year + '.' + month + '.' + day + ' ' + hours + ':' + minutes;

		return dateString;
	},

	get_schedule: function(leagueId, callback) {
		var self = this;

		$.get('/prediction', {
			'leagueId': leagueId || '426'
		}, function(baskets) {
			baskets = JSON.parse(baskets);
			var basketIdList = [];
			for (var i in baskets) {
				basketIdList.push(baskets[i].matchId);
			}

			$.get('/schedule/league', {
				'leagueId': leagueId || '426'
			}, function(matches) {
				var is_odd = true;

				$('#schedule_table').empty();

				for (var i in matches) {
					var toggle = basketIdList.indexOf(matches[i].id) > -1;
					var toggleDisable = false;
					var currentDate = new Date();

					if ((new Date(matches[i].date) < currentDate) || (toggle && (baskets[basketIdList.indexOf(matches[i].id)].confirmed == true))) {
						toggleDisable = true;
					}

					$('#schedule_table').append([
						'<tr', is_odd ? ' class="odd"' : '', '>',
							'<td class="schedule_date">', self.getDateString(matches[i].date), '</td>',
							'<td class="schedule_home_team">', matches[i].homeTeamName, '</td>',
							'<td class="schedule_vs">VS</td>',
							'<td class="schedule_away_team">', matches[i].awayTeamName, '</td>',
							'<td class="schedule_basket_toggle ', toggleDisable ? 'disable' : '', '"><span><i class="fa fa-toggle-', toggle ? 'on' : 'off', '"></i></span></td>',
							'<td class="schedule_chatting"><span><i class="fa fa-commenting-o"></i></span></td>',
						'</tr>'
					].join(''));

					$('#schedule_table tr').last().data('matchId', matches[i].id);
					$('#schedule_table tr').last().data('leagueId', matches[i].leagueId);
					$('#schedule_table tr').last().data('toggle', toggle);

					is_odd = !is_odd;
				}

				$(document).ready(function() {
					$('body').animate({'scrollTop': $('#schedule_table tr .schedule_basket_toggle:not(.disable)').first().offset().top - window.innerHeight / 2}, 800);
				});

				if (callback && typeof(callback) == 'function') {
					callback();
				}
			});
		});
	}
};
