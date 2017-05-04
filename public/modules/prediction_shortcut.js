var PREDICTION_SHORTCUT = {
	init: function() {
		this.initEvents();
        this.getBaskets();
	},

	initEvents: function() {
        var self = this;
        $('.prediction_shortcut_button').click(function() {
            $('.prediction_shortcut_button_container').hide();
            $('.prediction_shortcut_container').show();
        });

        $('.prediction_shortcut_close').click(function() {
            $('.prediction_shortcut_container').hide();
            $('.prediction_shortcut_button_container').show();
        });

        $('.do_prediction').click(function() {
            var prediction_shortcut_pick_length = $('.prediction_shortcut_pick').length / 3;

            var predictions = [];

            for (var i = 0; i < prediction_shortcut_pick_length; i++) {
                var value = $('[name=prediction_shortcut_pick_' + i + ']:checked').val();

                if (value) {
                    predictions.push({
                        'matchId': $('.prediction_shortcut_list tr').eq(i).data('matchId'),
                        'pick': value
                    });
                }
            }

            predictions = JSON.stringify(predictions);

            $.post('/prediction', {
                'predictions': predictions
            }, function(prediction) {
                self.getBaskets();
                if (SCHEDULE) {
                    SCHEDULE.get_schedule();
                }
            });
        });
	},

    getBaskets: function() {
        var self = this;
		$.get('prediction/basket', {}, function(data) {
            data = JSON.parse(data);
            
            if (data.length) {
                $('.prediction_shortcut_preview_number').show();
                $('.prediction_shortcut_preview_number').html(data.length);
            } else {
                $('.prediction_shortcut_preview_number').hide();
            }

            $('.prediction_shortcut_list tbody').empty();
            for (var i in data) {
                $('.prediction_shortcut_list tbody').eq(0).append([
                    '<tr>',
                        '<td>', self.getDateString(data[i].date), '</td>',
                        '<td>', data[i].homeTeamName, '</td>',
                        '<td>VS</td>',
                        '<td>', data[i].awayTeamName, '</td>',
                        '<td>',
                            '<label>홈승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="home"></label>',
                            '<label>무', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="draw"></label>',
                            '<label>원정승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="away"></label>',
                        '</td>',
                    '</tr>'
                ].join(''));

                $('.prediction_shortcut_list tr').last().data('matchId', data[i].id);
            }
        });
    },

	getDateString: function(date) {
		date = new Date(date);
		var month = date.getMonth() + 1;
		var day = date.getDate();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		month = month >= 10 ? month : '0' + month
		day = day >= 10 ? day : '0' + day;
		hours = hours >= 10 ? hours : '0' + hours;
		minutes = minutes >= 10 ? minutes : '0' + minutes;

		var dateString = month + '.' + day + ' ' + hours + ':' + minutes;

		return dateString;
	}
};
