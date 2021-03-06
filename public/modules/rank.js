var RANK = {
	init: function(initData) {
		this.init_events();
		this.scrollToTarget();
		this.totalPage = parseInt(initData.totalPage, 10);
		this.pageNo = parseInt(initData.pageNo, 10);

		notice.init();
		paging.init({
			'target': $('#rank_table'),
			'totalPage': initData.totalPage,
			'pageNo': initData.pageNo
		});

		if(initData.attendancePointUpdated) {
			notice.show('success', '100점의 출석 포인트가 적립되었습니다.');
		}
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

		$('.rank_search .rank_search_input').keydown(function(e) {
			if(e.keyCode == 13) {
				$('.rank_search .rank_search_btn').click();
			}
		});

		$('.rank_search .rank_search_btn').click(function() {
			var search_id = $('.rank_search .rank_search_input').val();
			location.href = "/rank?search_id=" + search_id;
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

		$('#rank_table').on('click', 'tr:not(:nth-child(1))', function() {
			var $this = $(this);
			location.href = '/search?id=' + $this.find('td.table_label_nickname').html()
		});

		//paging
		$(document).on('click', '#paging_firstPage', function() {
			location.href = '/rank?pageNo=1';
		});

		$(document).on('click', '#paging_lastPage', function() {
			location.href = '/rank?pageNo=' + (self.totalPage);
		});

		$(document).on('click', '#paging_prevPage', function() {
			location.href = '/rank?pageNo=' + (self.pageNo-1);
		});

		$(document).on('click', '#paging_nextPage', function() {
			location.href = '/rank?pageNo=' + (self.pageNo+1);
		});

		$(document).on('click', '.paging_number', function() {
			var value = $(this).attr('value');
			location.href = '/rank?pageNo=' + value;
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
