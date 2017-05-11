var BOARD = {
	init: function(data) {
		this.user_email = data.user_email;

		this.set_board();
		this.init_events();
	},

	init_events: function() {
		var self = this;

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

		$('.board_section .board_menu > .write').click(function() {
			location.href = '/board/write';
		});

		$(document).on('click', '#board_table tr:not(:first-child)', function() {
			if($(this).hasClass('board_content')) {
				return false;
			}
			if($(this).next('.board_content').css('display') == 'none') {
				$(this).css('border-bottom', 'none');
				$(this).next('.board_content').show();
			} else {
				$(this).css('border-bottom', '1px solid #999');
				$(this).next('.board_content').hide();
			}
		});

		$(document).on('click', '#board_table .board_options > button', function() {
			var button = this;
			var boardNo = $(button).parents('.board_content').prev('tr').attr('boardNo');
			
			if($(button).hasClass('update')) {
				location.href = "/board/write?no=" + boardNo;
			} else if($(button).hasClass('delete')) {
				$.post('/board/del', {
					'boardNo': boardNo
				}, function(result) {
					if(result) {
						location.reload();
					} else {
						console.log(result);
					}
				});
			} else if($(button).hasClass('like')) {
				$.post('/board/like', {
					'boardNo': boardNo
				}, function(result) {
					if(result) {
						var current_like = parseInt($(button).parents('.board_content').prev('tr').find('.current_like').html());
						if(result == 'like') {
							$(button).addClass('my_like');
							$(button).parents('.board_content').prev('tr').find('.current_like').html(current_like + 1);
						} else {
							$(button).removeClass('my_like');
							$(button).parents('.board_content').prev('tr').find('.current_like').html(current_like - 1);
						}
					} else{
						console.log(result);
					}
				});
			}
		})

        $('.board_search_menu .board_search_input').keydown(function(e) {
            if(e.keyCode == 13) {
                $('.board_search_menu .board_search_btn').click();
            }
        });

        $('.board_search_menu .board_search_btn').click(function() {
            var value = $('.board_search_menu .board_search_input').val();
            var type = '';
			var index = $('#dropdown option').index($('#dropdown option:selected'));
			if(index == 1){
				type += 'title';
			} else if(index ==2){
				type += 'writer';
			}
			console.log('type' , type);
            self.set_board({
                'value': value,
                'type': type || 'title'
            });
        });

		$('.tools .user_search_input').keydown(function(e) {
			if(e.keyCode == 13) {
				$('.tools .user_search_btn').click();
			}
		});

		$('.tools .user_search_btn').click(function() {
            var id = $('.tools .user_search_input').val();

            location.href = "/search?id=" + id;
		});
	},

	set_board: function(query) {
		var self = this;
		var board_html = '';

		var make_date = function(date) {
			date = new Date(date);

			var y = String(date.getFullYear());
			var m = String(date.getMonth() + 1);
			var d = String(date.getDate());
			var h = String(date.getHours());
			var min = String(date.getMinutes());
			var s = String(date.getSeconds());

			if(m.length === 1) {
				m = '0' + m;
			}
			if(d.length === 1) {
				d = '0' + d;
			}
			if(h.length === 1) {
				h = '0' + h;
			}
			if(min.length === 1) {
				min = '0' + min;
			}
			if(s.length === 1) {
				s = '0' + s;
			}

			var date_html = y + '/' + m + '/' + d + '<br>' + h + ':' + min + ':' + s;
			return date_html;
		};

		var get_tier_img = function(rating) {
			rating = parseInt(rating);

			if(rating < 1200) {
				return '<div class="rank_table_tier badge_bronze"></div>';
			} else if(1200 <= rating && rating < 1400) {
				return '<div class="rank_table_tier badge_silver"></div>';
			} else if(1400 <= rating && rating < 1600) {
				return '<div class="rank_table_tier badge_gold"></div>';
			} else if(1600 <= rating && rating < 1800) {
				return '<div class="rank_table_tier badge_platinum"></div>';
			} else if(1800 <= rating) {
				return '<div class="rank_table_tier badge_diamond"></div>';
			}
		};

		if (!query) {
			query = {};
		}

		$.get('/board/get', query, function(board_data) {
			if(!board_data || board_data.length == 0) {
				board_data = [];
			}

			for(i = 0; i < board_data.length; i++) {
                board_html += '<tr boardNo=' + board_data[i].boardNo + '>';
                board_html += '<td>' + board_data[i].boardNo + '</td>';
                board_html += '<td>' + ((board_data[i].readyGameCnt && board_data[i].readyGameCnt > 0) ? '<div class="rank_table_tier badge_ready"></div>' : get_tier_img(board_data[i].rating)) + board_data[i].nickname + '</td>';
                board_html += '<td>' + board_data[i].title + '</td>';
                board_html += '<td class="current_like">' + board_data[i].like + '</td>';
                board_html += '<td>' + make_date(board_data[i].date) + '</td>';
                board_html += '</tr>';

                board_html += '<tr class="board_content"><td colspan="5">';
                board_html += '<div class="board_options">';
                if (self.user_email === board_data[i].writer) {
                    board_html += '<button type="button" class="update">수정</button><button type="button" class="delete">삭제</button>';
                }
                board_html += '<button type="button" class="like ' + (board_data[i].i_like ? 'my_like' : '') + '"><i class="fa fa-thumbs-up"></i></button></div>';
                board_html += board_data[i].content + '</td></tr>';
            }

            $('#board_table tr:not(:first-child)').remove()
			$('#board_table').append(board_html);
		});
	}
};