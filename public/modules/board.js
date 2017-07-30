var BOARD = {
	init: function(initData) {
		this.user_email = initData.user_email;
		this.isLogin = initData.isLogin;
		this.totalPage;
		this.pageNo = parseInt(initData.pageNo, 10);

		notice.init();

		if(initData.attendancePointUpdated) {
			notice.show('success', '100점의 출석 포인트가 적립되었습니다.');
		}

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
			location.href = '/my_page';
		});

		$('#header .main_menu li').click(function() {
			var move = $(this).attr('move');
			location.href = '/' + move;
		});

		$('.board_section .board_menu > .write').click(function() {
			location.href = '/board/write';
		});

		$(document).on('click', '#board_table tr:not(:first-child)', function() {
			var boardNo = $(this).attr('boardNo');

			$.get('/board/get', {
				'boardNo': boardNo
			}, function(result) {
				if(result) {
					location.href = "/board/read?no=" + boardNo;
				} else {
					notice.show('alert', '삭제된 게시글입니다.');
				}
			});
		});

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

            self.set_board({
                'value': value,
                'type': type || 'title'
            });
        });

		$('.user_search_input').keydown(function(e) {
			if(e.keyCode == 13) {
				$('.user_search_btn').click();
			}
		});

		$('.user_search_btn').click(function() {
			var id = $('.user_search_input').val();

			location.href = "/search?id=" + id;
		});

		//paging
		$(document).on('click', '#paging_firstPage', function() {
			location.href = '/board?pageNo=1';
		});

		$(document).on('click', '#paging_lastPage', function() {
			location.href = '/board?pageNo=' + (self.totalPage);
		});

		$(document).on('click', '#paging_prevPage', function() {
			location.href = '/board?pageNo=' + (self.pageNo-1);
		});

		$(document).on('click', '#paging_nextPage', function() {
			location.href = '/board?pageNo=' + (self.pageNo+1);
		});

		$(document).on('click', '.paging_number', function() {
			var value = $(this).attr('value');
			location.href = '/board?pageNo=' + value;
		});
	},

	set_board: function(query) {
		var self = this;
		var board_html = '';

		var user_agent = navigator.userAgent;
		var isMobile = false;

		if (/mobile/i.test(user_agent) || /android/i.test(user_agent)) {
			isMobile = true;
		}

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

			var today = new Date();
			var todayDate = today.getDate();

			if(isMobile) {
				if(d == todayDate) {
					var date_html = h + ':' + min;
				} else {
					var date_html = m + '/' + d;
				}
			} else {
				var date_html = y + '/' + m + '/' + d + '<br>' + h + ':' + min + ':' + s;
			}
			return date_html;
		};

		var get_tier_img = function(myTotalRate) {
			myTotalRate = parseFloat(myTotalRate);

			if(myTotalRate <= 3) {
				return '<div class="rank_table_tier badge_diamond"></div>';
			} else if(3 < myTotalRate && myTotalRate <= 10) {
				return '<div class="rank_table_tier badge_platinum"></div>';
			} else if(10 < myTotalRate && myTotalRate <= 30) {
				return '<div class="rank_table_tier badge_gold"></div>';
			} else if(30 < myTotalRate && myTotalRate <= 70) {
				return '<div class="rank_table_tier badge_silver"></div>';
			} else if(70 < myTotalRate) {
				return '<div class="rank_table_tier badge_bronze"></div>';
			} else {
				return '<div class="rank_table_tier badge_ready"></div>';
			}
		};

		if (!query) {
			query = {};
		}

		query._limit = 20;
		query.pageNo = self.pageNo;
		$.get('/board/getList', query, function(data) {
			self.totalPage = Math.ceil(data.total/query._limit);
			var board_data = data.list;
			if(!board_data || board_data.length == 0) {
				board_data = [];
			}

			for(i = 0; i < board_data.length; i++) {
                board_html += '<tr boardNo=' + board_data[i].boardNo + '>';
                board_html += '<td>' + board_data[i].boardNo + '</td>';
                board_html += '<td>' + ((board_data[i].readyGameCnt && board_data[i].readyGameCnt > 0) ? '<div class="rank_table_tier badge_ready"></div>' : get_tier_img(board_data[i].myTotalRate)) + board_data[i].nickname + '</td>';
                board_html += '<td><nobr>' + board_data[i].title + '<nobr> <span class="commentsLength">[' + board_data[i].commentsCnt + ']</span></td>';
                board_html += '<td class="current_like">' + board_data[i].like + '</td>';
                board_html += '<td>' + make_date(board_data[i].date) + '</td>';
                board_html += '</tr>';

                board_html += '<tr class="board_content"><td colspan="5">';
                board_html += '<div class="board_options">';
                board_html += '</td></tr>';
            }

            $('#board_table tr:not(:first-child)').remove()
			$('#board_table').append(board_html);

			paging.init({
				'target': $('#board_table'),
				'totalPage': self.totalPage,
				'pageNo': query.pageNo || 1
			});
		});
	}
};
