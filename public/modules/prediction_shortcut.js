var PREDICTION_SHORTCUT = {
	init: function() {
		this.initEvents();
        this.setData();
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
            var prediction_shortcut_pick_length = $('.prediction_shortcut_table_row.unconfirmed').length;

            var predictions = [];

            for (var i = 0; i < prediction_shortcut_pick_length; i++) {
                var value = $('.prediction_shortcut_table_row.unconfirmed').eq(i).find('td.active').eq(0).attr('value');

                if (value) {
                    predictions.push({
                        'matchId': $('.prediction_shortcut_list.unconfirmed tr').eq(i).data('matchId'),
                        'pick': value
                    });
                }
            }

            stringifyedPredictions = JSON.stringify(predictions);

            $.post('/prediction', {
                'predictions': stringifyedPredictions
            }, function(prediction) {
                self.setData();

                if (typeof SCHEDULE !== 'undefined') {
                    SCHEDULE.get_schedule();
                }

                if (typeof CHAT !== 'undefined') {
                    CHAT.setPredictButtonCondition(prediction, predictions);
                }
            });
        });

		$('#prediction_shortcut_unconfirmed_table').on('click', '.prediction_shortcut_table_row.unconfirmed td:not(:first-child)', function() {
			var $this = $(this);
			var thisIsActive = $this.hasClass('active');

			if (thisIsActive) {
				$this.removeClass('active');
			} else {
				var tds = $this.closest('.prediction_shortcut_table_row.unconfirmed').find('td');

				for (var i = 0; i < tds.length; i++) {
					if (tds.eq(i).hasClass('active')) {
						tds.eq(i).removeClass('active');
						break;
					}
				}

				$this.addClass('active');
			}

		});

		$('.prediction_shortcut_container').on('click', '.prediction_shortcut_title:not(.active)', function() {
			var $this = $(this);
			var type = $this.hasClass('unconfirmed') ? 'unconfirmed': 'confirmed';
			$('.prediction_shortcut_title').removeClass('active');
			$this.addClass('active');

			$('.prediction_shortcut_list:not(.' + type + ')').hide();
			$('.prediction_shortcut_list.' + type).show();

            if($this.hasClass('unconfirmed')) {
                $('.do_prediction').show();
            } else {
                $('.do_prediction').hide();
            }
		});
	},

    setData: function() {
        var self = this;
		$.get('/prediction/basket', {}, function(data) {
            data = JSON.parse(data);

            if (data.length) {
                $('.prediction_shortcut_preview_number').show();
                $('.prediction_shortcut_preview_number').html(data.length);
                $('.prediction_shortcut_preview_number_inner_unconfirmed').css('visibility', 'visible');
                $('.prediction_shortcut_preview_number_inner_unconfirmed').html(data.length);
            } else {
                $('.prediction_shortcut_preview_number').hide();
                $('.prediction_shortcut_preview_number_inner_unconfirmed').css('visibility', 'hidden');
            }

            $('.prediction_shortcut_list.unconfirmed tbody').empty();
            for (var i in data) {
                $('.prediction_shortcut_list.unconfirmed tbody').eq(0).append([
                    '<tr class="prediction_shortcut_table_row unconfirmed">',
                        '<td>', self.getDateString(data[i].date), '</td>',
                        '<td value="home">', data[i].homeTeamName, '</td>',
                        '<td value="draw">무승부</td>',
                        '<td value="away">', data[i].awayTeamName, '</td>',
                        // '<td>',
                        //     '<label>홈승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="home"></label>',
                        //     '<label>무', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="draw"></label>',
                        //     '<label>원정승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="away"></label>',
                        // '</td>',
                    '</tr>'
                ].join(''));

                $('.prediction_shortcut_list.unconfirmed tr').last().data('matchId', data[i].id);
            }
        });

		$.get('/prediction/wait', {}, function(data) {
            data = JSON.parse(data);

            $('.prediction_shortcut_list.confirmed tbody').empty();
            for (var i in data) {
                $('.prediction_shortcut_list.confirmed tbody').eq(0).append([
                    '<tr class="prediction_shortcut_table_row confirmed">',
                        '<td>', self.getDateString(data[i].date), '</td>',
                        '<td value="home">', data[i].homeTeamName, '</td>',
                        '<td value="draw">무승부</td>',
                        '<td value="away">', data[i].awayTeamName, '</td>',
                        // '<td>',
                        //     '<label>홈승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="home"></label>',
                        //     '<label>무', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="draw"></label>',
                        //     '<label>원정승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="away"></label>',
                        // '</td>',
                    '</tr>'
                ].join(''));

				$('.prediction_shortcut_list.confirmed tr').last().find('td[value="' + data[i].pick + '"]').addClass('active');
                $('.prediction_shortcut_list.confirmed tr').last().data('matchId', data[i].id);
            }
		});
    },

	getDateString: function(date) {
		var dayArr = ['일', '월', '화', '수', '목', '금', '토'];
		date = new Date(date);
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = dayArr[date.getDay()];
		var _date = date.getDate();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		month = month >= 10 ? month : '0' + month
		_date = _date >= 10 ? _date : '0' + _date;
		hours = hours >= 10 ? hours : '0' + hours;
		minutes = minutes >= 10 ? minutes : '0' + minutes;

		var dateString = month + '.' + _date + ' (' + day + ')' + '<br>' + hours + ':' + minutes;

		return dateString;
	}
};
