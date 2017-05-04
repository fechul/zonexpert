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

		$('#schedule_table').on('click', 'td.schedule_basket_toggle', function() {
			var $this = $(this);
			var row = $(this).closest('tr');
			var toggle = row.data('toggle');

			$.ajax({
				'url': '/basket',
				'type': toggle ? 'DELETE' : 'POST',
				'data': {
					'matchId': row.data('matchId'),
					'leagueId': row.data('leagueId')
				},
				'dataType': 'json',
				'success': function(result) {
					if (result) {
						row.data('toggle', !toggle);
						$this.find('i').eq(0).removeClass('fa-toggle-' + (toggle ? 'on' : 'off')).addClass('fa-toggle-' + (toggle ? 'off' : 'on'));
					} else {
						console.log('err');
					}

				}
			});
		});

		$('#schedule_table').on('click', 'td.schedule_chatting', function() {
			console.log('go chatting');
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

		$.get('/basket', {
			'leagueId': leagueId || '426'
		}, function(baskets) {
			$.get('/schedule/league', {
				'leagueId': leagueId || '426'
			}, function(matches) {
				var is_odd = true;

				$('#schedule_table').empty();

				for (var i in matches) {
					var toggle = baskets.indexOf(matches[i].id) > -1;
					$('#schedule_table').append([
						'<tr', is_odd ? ' class="odd"' : '', '>',
							'<td class="schedule_date">', self.getDateString(matches[i].date), '</td>',
							'<td class="schedule_home_team">', matches[i].homeTeamName, '</td>',
							'<td class="schedule_vs">VS</td>',
							'<td class="schedule_away_team">', matches[i].awayTeamName, '</td>',
							'<td class="schedule_basket_toggle"><span><i class="fa fa-toggle-', toggle ? 'on' : 'off', '"></i></span></td>',
							'<td class="schedule_chatting"><span><i class="fa fa-commenting-o"></i></span></td>',
						'</tr>'
					].join(''));

					$('#schedule_table tr').last().data('matchId', matches[i].id);
					$('#schedule_table tr').last().data('leagueId', matches[i].leagueId);
					$('#schedule_table tr').last().data('toggle', toggle);

					is_odd = !is_odd;
				}

				if (callback && typeof(callback) == 'function') {
					callback();
				}
			});
		});
	}
};
