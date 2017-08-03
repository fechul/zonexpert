var MYPAGE = {
	init: function(initData) {
		notice.init();
		this.init_events();
		this.myNickName = initData.myNickName;

		this.currentShowCon = '';
		this.currentPage = 1;
		this.totalpage = 1;

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
			$('.leaveConfirmDiv').show();
			$(this).hide();
			$('#submitLeaveMemberConfirm').show();
		});

		$('#submitLeaveMemberConfirm').click(function() {
			var leaveReason = $('#leaveReason').val();
			var password = $('#leavePassword').val();

			$.post('/user/leave', {
				'leaveReason': leaveReason,
				'password': password
			}, function(leaveResult) {
				if(leaveResult.result && leaveResult != 'false') {
					$.post('/logout', {}, function(logout) {
		                if (logout.result) {
		                    location.href = "/";
		                } else {
		                    console.log(logout);
		                }
		            });
				} else {
					if(leaveResult.code == 2) {
						notice.show('alert', '비밀번호를 정확하게 입력해주세요.');
					} else {
						notice.show('alert', '회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.');
					}

				}
			});
		});

		$('#searchMyData').click(function() {
			location.href = "/search?id=" + self.myNickName;
		});

		$('.article_btn').click(function() {
			var dataType = $(this).attr('data-type');	// withdraw, charge, earn, use

			if(self.currentShowCon == dataType) {
				return false;
			}

			self.setLogs(dataType, 1);
		});

		//paging
		$(document).on('click', '#paging_firstPage', function() {
			setLogs(self.currentShowCon, 1);
		});

		$(document).on('click', '#paging_lastPage', function() {
			setLogs(self.currentShowCon, self.totalPage);
		});

		$(document).on('click', '#paging_prevPage', function() {
			setLogs(self.currentShowCon, self.currentPage-1);
		});

		$(document).on('click', '#paging_nextPage', function() {
			setLogs(self.currentShowCon, self.currentPage+1);
		});

		$(document).on('click', '.paging_number', function() {
			var value = $(this).attr('value');
			setLogs(self.currentShowCon, value);
		});
	},

	setLogs: function(type, pageNo) {
		var self = this;

		$.get('/user/pointLog', {
			'type': type,
			'pageNo': pageNo
		}, function(data) {
			$('.use_table_section').hide();
			$('.earn_table_section').hide();
			$('.charge_table_section').hide();
			$('.withdraw_table_section').hide();

			$('.' + type + '_table_section').show();

			$('#' + type + '_table tr').each(function(idx) {
				if(idx > 1) {
					$(this).remove();
				}
			});

			if(data && data.logs && data.logs.length) {
				var totalLength = data.length;
				var tableHtml = '';

				for(var i = 0; i < data.logs.length; i++) {
					var time = new Date(data.logs[i].time);
					var year = time.getFullYear();
					var month = (time.getMonth() < 10 ? '0' + (time.getMonth()+1) : (time.getMonth()+1));
					var day = (time.getDate() < 10 ? '0' + time.getDate() : time.getDate());
					if(type == 'charge') {
						tableHtml += '<tr>';
						tableHtml += '<td>' + year + '/' + month + '/' + day + '</td>';
						tableHtml += '<td>' + (data.logs[i].pointType == 'free' ? '무료' : '충전') + (data.logs[i].classification == 'attendance' ? '(출석 포인트)' : '') + '</td>';
						tableHtml += '<td><span style="color:#2d9e27;">+' + data.logs[i].amount + '</span></td>';
						tableHtml += '</tr>';
					} else if(type == 'use') {
						tableHtml += '<tr>';
						tableHtml += '<td>' + year + '/' + month + '/' + day + '</td>';
						tableHtml += '<td>' + (data.logs[i].useClassification == 'view' ? '사용자 조회' : '예측시스템 조회') + '</td>';
						tableHtml += '<td class="listMatch"><img src="' + data.logs[i].homeTeamImg + '"></img>' + data.logs[i].homeTeamName + ' <span class="versus">vs</span> <img src="' + data.logs[i].awayTeamImg + '"></img>' + data.logs[i].awayTeamName + '</td>';
						tableHtml += '<td>' + data.logs[i].targetNick || '-' + '</td>';
						tableHtml += '<td><span style="color:#e60b0b;">-' + data.logs[i].amount + '</span><br>' + (data.logs[i].pointType == 'free' ? '(무료포인트)' : '(충전포인트)') + '</td>';
						tableHtml += '</tr>';
					} else if(type == 'earn') {
						tableHtml += '<tr>';
						tableHtml += '<td>' + year + '/' + month + '/' + day + '</td>';
						tableHtml += '<td class="listMatch"><img src="' + data.logs[i].homeTeamImg + '"></img>' + data.logs[i].homeTeamName + ' <span class="versus">vs</span> <img src="' + data.logs[i].awayTeamImg + '"></img>' + data.logs[i].awayTeamName + '</td>';
						tableHtml += '<td>' + data.logs[i].targetNick + '</td>';
						tableHtml += '<td><span style="color:#2d9e27;">+' + data.logs[i].amount + '</span><br>' + (data.logs[i].pointType == 'free' ? '(무료포인트)' : '(충전포인트)') + '</td>';
						tableHtml += '</tr>';
					}
				}

				// $('.' + type + '_table_section .containerTable').empty();
				$('.' + type + '_table_section .containerTable').append(tableHtml);
			} else {
				$('.' + type + '_table_section .noDataRow').show();
			}

			self.currentShowCon = type;
			self.currentPage = pageNo;
			self.totalPage = data.totalPage;

			// type - use, earn, charge, withdraw
			var target;
			if(type == 'use') {
				target = $('#use_table');
			} else if(type == 'earn') {
				target = $('#earn_table');
			} else if(type == 'charge') {
				target = $('#charge_table');
			} else {
				return false;
			}

			if(!self.totalPage || self.totalPage == 0) {
				return false;
			}
			paging.init({
				'target': target,
				'totalPage': self.totalPage,
				'pageNo': pageNo || 1
			});
		});
	}
};
