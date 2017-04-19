var INDEX = {
	init: function() {
		this.init_events();
	},

	init_events() {
		$('#header .tools .signup').click(function() {
			location.href = "/signup";
		});
	}
}