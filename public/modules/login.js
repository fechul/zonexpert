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
	}
};
