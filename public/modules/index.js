var INDEX = {
	init: function() {
		this.init_events();
		this.set_rank();
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
					location.reload();
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

	// DB에 저장된 데이터를 받아와서 rank_data로 넣으면 됨.
	set_rank: function() {
		var rank_data = [
			{
				rank: 1,
				nickname: '존문가1',
				main_sport: 'K리그',
				score: 2200,
				predict_success: 45,
				predict_fail: 5,
				predict_rate: 90,
				tier_code: 5
			},
			{
				rank: 2,
				nickname: '존문가2',
				main_sport: '프리미어리그',
				score: 2050,
				predict_success: 42,
				predict_fail: 8,
				predict_rate: 84,
				tier_code: 5
			},
			{
				rank: 3,
				nickname: '존문가3',
				main_sport: '라리가',
				score: 1950,
				predict_success: 40,
				predict_fail: 10,
				predict_rate: 80,
				tier_code: 4
			},
			{
				rank: 4,
				nickname: '존문가4',
				main_sport: '분데스리그',
				score: 1900,
				predict_success: 35,
				predict_fail: 15,
				predict_rate: 70,
				tier_code: 4
			},
			{
				rank: 5,
				nickname: '존문가5',
				main_sport: '세리에 A',
				score: 1760,
				predict_success: 30,
				predict_fail: 20,
				predict_rate: 60,
				tier_code: 3
			},
			{
				rank: 6,
				nickname: '존문가6',
				main_sport: '리그 1',
				score: 1550,
				predict_success: 25,
				predict_fail: 25,
				predict_rate: 50,
				tier_code: 3
			},
			{
				rank: 7,
				nickname: '존문가7',
				main_sport: '에레디비시',
				score: 1420,
				predict_success: 22,
				predict_fail: 28,
				predict_rate: 44,
				tier_code: 2
			},
			{
				rank: 8,
				nickname: '존문가8',
				main_sport: '챔피언스리그',
				score: 1400,
				predict_success: 20,
				predict_fail: 30,
				predict_rate: 40,
				tier_code: 2
			},
			{
				rank: 9,
				nickname: '존문가9',
				main_sport: '유로파리그',
				score: 1300,
				predict_success: 15,
				predict_fail: 35,
				predict_rate: 30,
				tier_code: 1
			},
			{
				rank: 10,
				nickname: '존문가10',
				main_sport: '잉글랜드FA컵',
				score: 1180,
				predict_success: 10,
				predict_fail: 40,
				predict_rate: 20,
				tier_code: 1
			}
		];

		var get_tier_info = function(code) {
			switch(code) {
				case 1:
					return '<div><div class="rank_table_tier badge_bronze"></div><span class="table_tier_name">브론즈</span></div>';
					break;
				case 2:
					return '<div class="rank_table_tier badge_silver"></div><span class="table_tier_name">실버</span>';
					break;
				case 3:
					return '<div class="rank_table_tier badge_gold"></div><span class="table_tier_name">골드</span>';
					break;
				case 4:
					return '<div class="rank_table_tier badge_platinum"></div><span class="table_tier_name">플래티넘</span>';
					break;
				case 5:
					return '<div><div class="rank_table_tier badge_diamond"></div><span class="table_tier_name">다이아</span></div>';
					break;
			}
		};

		var table_html = '';

		for(var i = 0; i < 10; i++) {
			table_html += '<tr>';
			table_html += '<td>' + rank_data[i].rank + '</td>';
			table_html += '<td>' + rank_data[i].nickname + '</td>';
			table_html += '<td>' + rank_data[i].main_sport + '</td>';
			table_html += '<td>' + rank_data[i].score + '</td>';
			table_html += '<td>' + rank_data[i].predict_success + ' / ' + rank_data[i].predict_fail + '</td>';
			table_html += '<td>' + rank_data[i].predict_rate + '%' + '</td>';
			table_html += '<td class="tier_cell left">' + get_tier_info(rank_data[i].tier_code) + '</td>';
			table_html += '</tr>';
		}

		$('#rank_table').append(table_html);
	}
};
