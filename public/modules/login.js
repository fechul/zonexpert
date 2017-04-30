var LOGIN = {
	init: function() {
		this.init_events();
	},

	init_events: function() {
		$('#login_btn').click(function() {
			$.post('/login', {
				'email': $('#email_input').val(),
				'password': $('#pw_input').val()
			}, function(login) {
				if (login.result) {
					location.replace('/');
				} else {
					console.log(login);
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
