var INDEX = {
	init: function() {
		this.init_events();
	},

	init_events() {
		$('#header .tools .signup').click(function() {
			location.href = "/signup";
		});

		$('#header .tools .login').click(function() {
			location.href = "/login";
		});
	}
}