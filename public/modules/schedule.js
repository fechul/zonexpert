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
	},

	getDateString: function(date) {
		date = new Date(date);
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		month = month >= 10 ? month : '0' + month
		var day = date.getDate();
		day = day >= 10 ? day : '0' + day;
		var hours = date.getHours();
		hours = hours >= 10 ? hours : '0' + hours;
		var minutes = date.getMinutes();
		minutes = minutes >= 10 ? minutes : '0' + minutes;
		var dateString = year + '.' + month + '.' + day + ' ' + hours + ':' + minutes;

		return dateString;
	},

	get_schedule: function(leagueId, callback) {
		var self = this;

		$.get('/schedule/league', {
			'leagueId': leagueId || '426'
		}, function(matches) {
			var is_odd = true;
			$('#schedule_table').empty();
			for (var i in matches) {
				$('#schedule_table').append([
					'<tr', is_odd ? ' class="odd"' : '', '>',
						'<td class="schedule_date">', self.getDateString(matches[i].date), '</td>',
						'<td class="schedule_date">', matches[i].homeTeamName, '</td>',
						'<td class="schedule_date">VS</td>',
						'<td class="schedule_date">', matches[i].awayTeamName, '</td>',
						'<td class="schedule_date">예측</td>',
						'<td class="schedule_date">채팅</td>',
					'</tr>'
				].join(''));
				is_odd = !is_odd;
			}

			if (callback && typeof(callback) == 'function') {
				callback();
			}
		});
	}
};
