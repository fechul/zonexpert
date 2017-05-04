var RANK = {
	init: function() {
		this.init_events();
		this.scrollToTarget();
	},

	init_events: function() {
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

		$('.rank_search .rank_search_input').keydown(function(e) {
			if(e.keyCode == 13) {
				$('.rank_search .rank_search_btn').click();
			}
		});

		$('.rank_search .rank_search_btn').click(function() {
			var search_id = $('.rank_search .rank_search_input').val();
			location.href = "/rank?search_id=" + search_id;
		});
	},

	scrollToTarget: function() {
		var windowHeight = window.innerHeight;

		if($('#target_row').length) {
			var offset = $('#target_row').offset();
			$('body').animate({scrollTop: offset.top - (windowHeight/2)}, 400);
		}
	}
};