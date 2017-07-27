var BOARD_READ = {
	init: function(initData) {
		this.boardNo = initData.boardNo;

		notice.init();

		if(initData.attendancePointUpdated) {
			notice.show('success', '100점의 출석 포인트가 적립되었습니다.');
		}

		this.init_events();
		this.setComments();
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

		$('#update').click(function() {
			location.href = "/board/write?no=" + self.boardNo;
		});

		$('#delete').click(function() {
			$.post('/board/del', {
				'boardNo': self.boardNo
			}, function(result) {
				if(result) {
					location.href = '/board';
				} else {
					notice.show('alert', '게시글을 삭제할 수 없습니다.');
				}
			});
		});

		$('#like').click(function() {
			var $button = $(this);
			$.post('/board/like', {
				'boardNo': self.boardNo
			}, function(result) {
				if(result) {
					if(result == 'like') {
						$button.addClass('my_like');
					} else {
						$button.removeClass('my_like');
					}
				} else{
					console.log(result);
				}
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

		$('#writeComment').click(function() {
			var content = $('#writeCommentsInput').val();

			$.post('/comment/write', {
				'boardNo': self.boardNo,
				'content': content
			}, function(write) {
				if(write) {
					if(write.result) {
						self.setComments();
					} else {
						if(write.code == 11) {
							notice.show('alert', '댓글 내용을 입력해주세요.');	
						} else {
							notice.show('alert', '댓글 작성에 실패했습니다. 잠시 후 다시 시도해주세요.');	
						}
					}
				} else {
					notice.show('alert', '로그인 후 이용해주세요.');
				}
			});
		});

		$('#copySrc').click(function() {
		    var clipboard = new Clipboard('#copySrc');
		    clipboard.on('success', function() {
		        notice.show('success', '주소가 복사되었습니다.');
		    });
		    clipboard.on('error', function() {
		        notice.show('alert', '주소를 복사할 수 없습니다.');
		    });
		});
	},

	setComments: function() {
		var self = this;

        $.get('/board/getComments', {
        	'boardNo': self.boardNo
        }, function(comments) {
        	$('.commentsContentContainer').empty();
        	$('#writeCommentsInput').val('');

        	var commentsHtml = '';
        	if(comments && comments.length) {
        		commentsHtml = '<div class="commentLabel">댓글(' + comments.length + ')</div>';
        		for(var i = 0; i < comments.length; i++) {
        			commentsHtml += '<li class="commentsEach">';
	        		commentsHtml += '<div class="commentUserInfo">';
	        		commentsHtml += '<div class="commentWriterTier ' + comments[i].writerTier + '"></div>';
	        		commentsHtml += '<span class="commentWriter"><nobr>' + comments[i].writerNick + '</nobr></span>';

	        		var wd = new Date(comments[i].date);
	        		var wd_year = wd.getFullYear();
	        		var wd_month = wd.getMonth()+1;
	        		var wd_date = wd.getDate();
	        		var wd_hour = wd.getHours();
	        		var wd_min = wd.getMinutes();
	        		var wd_sec = wd.getSeconds();

	        		if(wd_month < 10) {
	        			wd_month = '0' + wd_month;
	        		}
	        		if(wd_date < 10) {
	        			wd_date = '0' + wd_date;
	        		}
	        		if(wd_hour < 10) {
	        			wd_hour = '0' + wd_hour;
	        		}
	        		if(wd_min < 10) {
	        			wd_min = '0' + wd_min;
	        		}
	        		if(wd_sec < 10) {
	        			wd_sec = '0' + wd_sec;
	        		}

	        		commentsHtml += '<div class="commentWriteDate">' + wd_year + '/' + wd_month + '/' + wd_date + ' ' + wd_hour + ':' + wd_min + ':' + wd_sec +  '</div>';
	        		commentsHtml += '</div>';
	        		commentsHtml += '<div class="commentContent">' + comments[i].content + '</div>';
	        		commentsHtml += '</li>';
        		}
        	} else {
        		commentsHtml = '<div class="commentLabel">댓글(0)</div>';
        		commentsHtml = '<li class="commentsEach noComments">등록된 댓글이 없습니다.</li>';
        	}

        	$('.commentsContentContainer').append(commentsHtml);
        });
	}
};
