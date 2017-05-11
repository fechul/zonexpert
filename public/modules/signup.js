var SIGNUP = {
	init: function() {
		this.init_events();
		notice.init();
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
		    		if(signup.code == 1) {
		    			notice.show('alert', '회원가입에 실패했습니다. 잠시후 다시 시도해주세요.');
		    		} else if(signup.code == 11) {
		    			notice.show('alert', '이미 존재하는 닉네임입니다.');
					} else if(signup.code == 12) {
						notice.show('alert', '이미 가입된 이메일입니다.');
					} else if(signup.code == 21) {
						notice.show('alert', '이메일이 형식에 맞지 않습니다.');
					} else if(signup.code == 31) {
						notice.show('alert', '닉네임 길이를 2자~12자 사이로 입력해주세요.');
					} else if(signup.code == 32) {
						notice.show('alert', '닉네임이 형식에 맞지 않습니다.');
					} else if(signup.code == 41) {
						notice.show('alert', '비밀번호 확인이 틀렸습니다.');
					} else if(signup.code == 42) {
						notice.show('alert', '비밀번호를 8자~20자 사이로 입력해주세요.');
					} else if(signup.code == 43) {
						notice.show('alert', '비밀번호에 공백이 들어갈 수 없습니다.');
					} else if(signup.code == 44) {
						notice.show('alert', '비밀번호가 형식에 맞지 않습니다.');
					} else if(signup.code == 51) {
						notice.show('alert', '메인 스포츠를 선택해주세요.');
					} else if(signup.code == 52) {
						notice.show('alert', '메인 리그를 선택해주세요.');
					} else {
						notice.show('alert', '회원가입에 실패했습니다. 잠시후 다시 시도해주세요.');
					}
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
