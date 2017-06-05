var MYPAGE = {
	init: function(initData) {
		notice.init();
		this.init_events();
		this.myNickName = initData.myNickName;

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

        $('#header li.my_point > img').click(function() {
			location.href = '/my_page';
		});

		$('#header li.my_point > span').click(function() {
			location.href = '/my_page';
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

		$('.changeinfo_btns > button').click(function() {
			var value = $(this).attr('value');
			$(this).parent('.changeinfo_btns').find('button').removeClass('active');
			$(this).addClass('active');

			if(value == 'change') {
				$('#changeinfo_wrap .leave_member_field').hide();
				$('#changeinfo_wrap .changinfo_input_field').show();
			} else if(value == 'leave') {
				$('#changeinfo_wrap .changinfo_input_field').hide();
				$('#changeinfo_wrap .leave_member_field').show();
			}
		});

		$('#submitChangeInfo').click(function() {
			var changeNick = $('#nickname').val();
			var changepw = $('#inputNewPassword').val();
			var changepwConfirm = $('#inputConfirmPassword').val();

			$.post('/accounts/change', {
				'nickname': changeNick,
				'password': changepw,
				'password_check': changepwConfirm
			}, function(data) {
				if(data.result) {
					$('#showNickName').html(changeNick);
					notice.show('success', '회원정보 변경이 완료되었습니다.');
				} else {
					if(data.code == 1) {
						notice.show('alert', '회원정보 변경에 실패했습니다. 잠시후 다시 시도해주세요.');
					} else if(data.code == 11) {
						notice.show('alert', '이미 존재하는 닉네임입니다.');
					} else if(data.code == 31) {
						notice.show('alert', '닉네임을 2자~12자 사이로 입력해주세요.');
					} else if(data.code == 41) {
						notice.show('alert', '비밀번호 확인이 잘못되었습니다.');
					} else if(data.code == 42) {
						notice.show('alert', '비밀번호를 8자~20자 사이로 입력해주세요.');
					} else if(data.code == 43) {
						notice.show('alert', '비밀번호에 공백이 들어갈 수 없습니다.');
					} else if(data.code == 44) {
						notice.show('alert', '비밀번호가 형식에 어긋납니다.');
					} else {
						notice.show('alert', '회원정보 변경에 실패했습니다. 잠시후 다시 시도해주세요.');
					}
				}
			});
		});

		$('#inputConfirmPassword').keydown(function(e) {
			if(e.keyCode == 13) {
				$('#submitChangeInfo').click();
			}
		});

		$('#submitLeaveMember').click(function() {
			var reason = $('#leaveReason').val();
		});

		$('#searchMyData').click(function() {
			location.href = "/search?id=" + self.myNickName;
		});
	}
};

