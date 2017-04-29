var SIGNUP = {
	init: function() {
		this.init_events();
	},

	init_events: function() {
		var self = this;

		$('#signup_cancel').click(function() {
			document.referrer ? history.back() : location.href="/";
		});

		$('#main_sport_select').change(function() {
			var sport = $(this).val();
			self.set_league_select(sport);
		});

		$('#signup_btn').click(function() {
			$.post('/accounts', {
				'email': $('#email_input').val(),
				'nickname': $('#nick_input').val(),
				'password': $('#pw_input').val(),
				'password_check': $('#pw_check_input').val()
			}, function(signup) {
				if (signup.result) {
					location.replace('/');
				} else {
					console.log(signup);
				}
			});
		});
	},

	set_league_select: function(sport) {
		var select_html = '';

		switch(sport) {
			case 'none':
				select_html += '<option value="select_league">리그 선택</option>';
				break;
			case 'soccer':
				select_html += '<option value="select_league">리그 선택</option>';
				select_html += '<option value="k-league">K리그</option>';
				select_html += '<option value="premier-league">프리미어리그</option>';
				select_html += '<option value="laliga">라리가</option>';
				select_html += '<option value="bundesliga">분데스리가</option>';
				select_html += '<option value="seria-a">세리에 A</option>';
				select_html += '<option value="league-1">리그 1</option>';
				select_html += '<option value="eredivisie">에레디비시</option>';
				select_html += '<option value="champions-league">챔피언스리그</option>';
				select_html += '<option value="europa-league">유로파리그</option>';
				select_html += '<option value="england-fa">잉글랜드FA컵</option>';
				select_html += '<option value="efl-cup">EFL컵</option>';
				break;
		}

		$('#main_league_select > option').remove();
		$('#main_league_select').append(select_html);
	}
};
