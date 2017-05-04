var PREDICTION_SHORTCUT = {
	init: function() {
		this.initEvents();
        // this.getBaskets();
	},

	initEvents: function() {
        $('.prediction_shortcut_button').click(function() {
            $('.prediction_shortcut_button_container').hide();
            $('.prediction_shortcut_container').show();
        });

        $('.prediction_shortcut_close').click(function() {
            $('.prediction_shortcut_container').hide();
            $('.prediction_shortcut_button_container').show();
        });

        $('.do_prediction').click(function() {
            console.log('hi');
        });
	},

    getBaskets: function() {
        console.log('dd');
		$.get('/basket', {}, function(baskets) {
            for (var i in baskets) {
                $('.prediction_shortcut_list').eq(0).append([
                    '<tr>',
                        '<td>',
                    '</tr>'
                ].join(''));
            }
        });
    },

	getDateString: function(date) {
		date = new Date(date);
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		month = month >= 10 ? month : '0' + month
		day = day >= 10 ? day : '0' + day;
		hours = hours >= 10 ? hours : '0' + hours;
		minutes = minutes >= 10 ? minutes : '0' + minutes;

		var dateString = year + '.' + month + '.' + day + ' ' + hours + ':' + minutes;

		return dateString;
	}
};
