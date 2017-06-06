var LOGIN = {
	init: function() {
		var remeberId = localStorage.getItem('zeRememberEmail');
		if (remeberId) {
			$('#email_input').val(remeberId);
		}
		this.init_events();
		notice.init();
	},

	init_events: function() {
		$('#login_btn').click(function() {
			$.post('/login', {
				'email': $('#email_input').val(),
				'password': $('#pw_input').val()
			}, function(login) {
				if (login.result) {
					if ($('#remember_email').prop('checked')) {
						localStorage.setItem('zeRememberEmail', $('#email_input').val());
					} else {
						localStorage.removeItem('zeRememberEmail');
					}
					location.replace('/');
				} else {
					var err_msg = '';
					if(login.code == 1) {
						err_msg = '가입된 이메일이 없습니다.';
					} else if(login.code == 2) {
						err_msg = '비밀번호가 틀렸습니다.';
					} else if(login.code == 3) {
						err_msg = '인증되지 않은 이메일입니다. 인증 후 다시 시도해주세요.';
					} else {
						err_msg = '로그인에 실패하였습니다.';
					}
					notice.show('alert', err_msg);
				}
			});
		});

		$('#email_input').keydown(function(e) {
			if(e.keyCode === 13) {
				$('#login_btn').click();
			}
		});

		$('#pw_input').keydown(function(e) {
			if(e.keyCode === 13) {
				$('#login_btn').click();
			}
		});
	}
};
