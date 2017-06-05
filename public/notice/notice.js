var NOTICE = {
	init: function() {
		$('#notice').click(function() {
			$(this).fadeOut(500);
		});
	},
	show: function(type, msg) {
		var notice = $('#notice');
		var notice_content = $('#notice-content');
		var notice_icon = $('#notice-icon');

		notice_icon.empty();
		notice_icon.removeClass('alert');
		notice_icon.removeClass('success');
		if(type == 'alert') {
			notice_icon.addClass('alert');
			if(notice.length) {
				if(notice_content.length) {
					notice_icon.append('<i class="fa fa-exclamation-circle fa-3"></i>');
					notice_content.html(msg);

					notice.fadeIn(500);

					setTimeout(function() {
						notice.fadeOut(500);
					}, 10000);
				}
			}
		} else if(type == 'success') {
			notice_icon.addClass('success');
			if(notice.length) {
				if(notice_content.length) {
					notice_icon.append('<i class="fa fa-check-circle fa-3"></i>');
					notice_content.html(msg);
					notice.show();

					setTimeout(function() {
						notice.fadeOut(500);
					}, 10000);
				}
			}
		}
	}
};
