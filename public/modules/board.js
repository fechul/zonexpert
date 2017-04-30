var BOARD = {
	init: function() {
		this.init_events();
		this.set_board();
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
	},

	set_board: function() {
		var board_html = '';

		var board_data = [
			{
				board_id: '',
				board_number: 1,
				writer: '존문가1',
				title: '제목1',
				like: 27,
				date: new Date()
			},
			{
				board_id: '',
				board_number: 2,
				writer: '존문가2',
				title: '제목2제목2제목2',
				like: 36,
				date: new Date()
			},
			{
				board_id: '',
				board_number: 3,
				writer: '존문가3',
				title: '제목3제목3',
				like: 11,
				date: new Date()
			},
			{
				board_id: '',
				board_number: 4,
				writer: '존문가4',
				title: '제목4!!!!!!!!!!!!!!!!',
				like: 540,
				date: new Date()
			},
			{
				board_id: '',
				board_number: 5,
				writer: '존문가5',
				title: '제목5555555',
				like: 99,
				date: new Date()
			}
		];

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
		}

		for(i = 0; i < board_data.length; i++) {
			board_html += '<tr>';
			board_html += '<td>' + board_data[i].board_number + '</td>';
			board_html += '<td>' + board_data[i].writer + '</td>';
			board_html += '<td>' + board_data[i].title + '</td>';
			board_html += '<td>' + board_data[i].like + '</td>';
			board_html += '<td>' + make_date(board_data[i].date) + '</td>';
			board_html += '</tr>';
		}

		$('#board_table').append(board_html);
	}
};