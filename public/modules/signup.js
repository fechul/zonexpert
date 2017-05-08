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
			var main_sport = $('#main_sport_select').val();
			var main_league = $('#main_league_select').val();

			if(main_sport == 'none') {
				return false;
			}

			if(main_league == 'none') {
				return false;
			}

			if(isNaN(parseInt(main_league))) {
				return false;
			}

			$.post('/accounts', {
				'email': $('#email_input').val(),
				'nickname': $('#nick_input').val(),
				'password': $('#pw_input').val(),
				'password_check': $('#pw_check_input').val(),
				'main_sport': main_sport,
				'main_league': main_league
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
				select_html += '<option value="none">리그 선택</option>';
				break;
			case '1':
				select_html += '<option value="none">리그 선택</option>';
				select_html += '<option value="k-league">K리그</option>';
				select_html += '<option value="426">프리미어리그</option>';
				select_html += '<option value="436">라리가</option>';
				select_html += '<option value="430">분데스리가</option>';
				select_html += '<option value="438">세리에 A</option>';
				select_html += '<option value="434">리그 1</option>';
				select_html += '<option value="433">에레디비시</option>';
				select_html += '<option value="440">챔피언스리그</option>';
				select_html += '<option value="europa-league">유로파리그</option>';
				select_html += '<option value="429">잉글랜드FA컵</option>';
				select_html += '<option value="efl-cup">EFL컵</option>';
				select_html += '<option value="432">포칼컵</option>';
				select_html += '<option value="439">포르투갈</option>';
				break;
		}

		$('#main_league_select > option').remove();
		$('#main_league_select').append(select_html);
	}
};
