var PREDICTION_SHORTCUT = {
	init: function() {
		this.initEvents();
        this.setData();
	},

	initEvents: function() {
        var self = this;
        $('.prediction_shortcut_button').click(function() {
            $('.prediction_shortcut_button_container').hide();

			var type = '';

			if ($('.prediction_shortcut_title.active').hasClass('unconfirmed')) {
				type = 'unconfirmed';
			} else if ($('.prediction_shortcut_title.active').hasClass('confirmed')) {
				type = 'confirmed';
			} else {
				type = 'result';
			}

			if ($('.prediction_shortcut_list.' + type + ' tr').length) {
				$('.prediction_shortcut_list_header').css('visibility', 'visible');
			} else {
				$('.prediction_shortcut_list_header').css('visibility', 'hidden');
			}

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
                var value = $('.prediction_shortcut_table_row.unconfirmed').eq(i).find('td.selected').eq(0).attr('value');

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
            	if(prediction && prediction.result) {
            		self.setData();

	                if (typeof SCHEDULE !== 'undefined') {
	                    SCHEDULE.get_schedule();
	                }

	                if (typeof CHAT !== 'undefined') {
	                    CHAT.setPredictButtonCondition(prediction, predictions);
	                }
            	} else {
            		if(prediction.err_code == 10) {
            			notice.show('alert', '한 번에 최대 10경기를 예측을 할 수 있습니다.');
            		} else {
            			notice.show('alert', '예측을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.');
            		}
            	}
            });
        });

		$('#prediction_shortcut_unconfirmed_table').on('click', '.prediction_shortcut_table_row.unconfirmed td:not(:first-child)', function() {
			var $this = $(this);
			var isSelected = $this.hasClass('selected');

			if (isSelected) {
				$this.removeClass('selected');
			} else {
				var tds = $this.closest('.prediction_shortcut_table_row.unconfirmed').find('td');

				for (var i = 0; i < tds.length; i++) {
					if (tds.eq(i).hasClass('selected')) {
						tds.eq(i).removeClass('selected');
						break;
					}
				}

				$this.addClass('selected');
			}

		});

		$('.prediction_shortcut_container').on('click', '.prediction_shortcut_title:not(.active)', function() {
			var $this = $(this);
			var type = '';

			if ($this.hasClass('unconfirmed')) {
				type = 'unconfirmed';
				$('.prediction_shortcut_result_notice').hide();
			} else if ($this.hasClass('confirmed')) {
				type = 'confirmed';
				$('.prediction_shortcut_result_notice').hide();
			} else {
				type = 'result';
				$('.prediction_shortcut_result_notice').show();
			}

			$('.prediction_shortcut_title').removeClass('active');
			$this.addClass('active');

			$('.prediction_shortcut_list:not(.' + type + ')').hide();

			if ($('.prediction_shortcut_list.' + type + ' tr').length) {
				$('.prediction_shortcut_list_header').css('visibility', 'visible');
			} else {
				$('.prediction_shortcut_list_header').css('visibility', 'hidden');
			}

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
				$('.prediction_shortcut_list.unconfirmed .prediction_shortcut_list_no_contents').hide();
				$('#prediction_shortcut_unconfirmed_table').show();
            } else {
                $('.prediction_shortcut_preview_number').hide();
                $('.prediction_shortcut_preview_number_inner_unconfirmed').css('visibility', 'hidden');
				$('#prediction_shortcut_unconfirmed_table').hide();
				$('.prediction_shortcut_list.unconfirmed .prediction_shortcut_list_no_contents').show();
            }

			if ($('.prediction_shortcut_title.active').hasClass('unconfirmed')) {
	            if (data.length) {
					$('.prediction_shortcut_list_header').css('visibility', 'visible');
				} else {
					$('.prediction_shortcut_list_header').css('visibility', 'hidden');
				}
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

			if (data.length) {
				$('.prediction_shortcut_list.confirmed .prediction_shortcut_list_no_contents').hide();
				$('#prediction_shortcut_confirmed_table').show();
			} else {
				$('#prediction_shortcut_confirmed_table').hide();
				$('.prediction_shortcut_list.confirmed .prediction_shortcut_list_no_contents').show();
			}

			if ($('.prediction_shortcut_title.active').hasClass('confirmed')) {
	            if (data.length) {
					$('.prediction_shortcut_list_header').css('visibility', 'visible');
				} else {
					$('.prediction_shortcut_list_header').css('visibility', 'hidden');
				}
			}

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

				$('.prediction_shortcut_list.confirmed tr').last().find('td[value="' + data[i].pick + '"]').addClass('confirmed');
            }
		});

		$.get('/prediction/result', {}, function(data) {
			data = JSON.parse(data);
			var winner = '';
			var pick = '';

            $('.prediction_shortcut_list.result tbody').empty();

			if (data.length) {
				$('.prediction_shortcut_list.result .prediction_shortcut_list_no_contents').hide();
				$('#prediction_shortcut_result_table').show();
			} else {
				$('#prediction_shortcut_result_table').hide();
				$('.prediction_shortcut_list.result .prediction_shortcut_list_no_contents').show();
			}

			if ($('.prediction_shortcut_title.active').hasClass('result')) {
	            if (data.length) {
					$('.prediction_shortcut_list_header').css('visibility', 'visible');
				} else {
					$('.prediction_shortcut_list_header').css('visibility', 'hidden');
				}
			}

            for (var i in data) {
                $('.prediction_shortcut_list.result tbody').eq(0).append([
					'<tr class="prediction_shortcut_table_row result">',
                        '<td rowspan="2">', self.getDateString(data[i].date), '</td>',
						'<td value="home">', data[i].homeTeamName, '</td>',
						'<td value="draw">무승부</td>',
						'<td value="away">', data[i].awayTeamName, '</td>',
						// '<td>',
						//     '<label>홈승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="home"></label>',
						//     '<label>무', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="draw"></label>',
						//     '<label>원정승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="away"></label>',
						// '</td>',
					'</tr>',
					'<tr class="prediction_shortcut_table_row result_detail">',
						'<td style="display: none;"></td>',
						'<td value="home">', data[i].result.goalsHomeTeam, '</td>',
						'<td value="draw">:</td>',
						'<td value="away">', data[i].result.goalsAwayTeam, '</td>',
						// '<td>',
						//     '<label>홈승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="home"></label>',
						//     '<label>무', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="draw"></label>',
						//     '<label>원정승', '<input type="radio" class="prediction_shortcut_pick" name="prediction_shortcut_pick_', i, '"value="away"></label>',
						// '</td>',
					'</tr>'
                ].join(''));

				winner = '';
				pick = data[i].pick;

				if (data[i].result.goalsHomeTeam > data[i].result.goalsAwayTeam) {
					winner = 'home';
					$('.prediction_shortcut_list.result tr').last().find('td[value="home"]').addClass('game_result');
				} else if (data[i].result.goalsHomeTeam < data[i].result.goalsAwayTeam) {
					winner = 'away';
					$('.prediction_shortcut_list.result tr').last().find('td[value="away"]').addClass('game_result');
				} else {
					winner = 'draw';
					$('.prediction_shortcut_list.result tr').last().find('td[value="draw"]').addClass('game_result');
				}

				if (winner == pick) {
					$('.prediction_shortcut_list.result tr').last().prev().find('td[value="' + data[i].pick + '"]').addClass('pick_hit');
				} else {
					$('.prediction_shortcut_list.result tr').last().prev().find('td[value="' + data[i].pick + '"]').addClass('pick_fail');
				}
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
