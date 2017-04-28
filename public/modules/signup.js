var SIGNUP = {
	init: function() {
		this.init_events();
	},

	init_events: function() {
		$('#signup_cancel').click(function() {
			document.referrer ? history.back() : location.href="/";
		});
	}
};