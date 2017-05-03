var BOARD_WRITE = {
	init: function(options) {
		this.isUpdate = options.isUpdate;
		this.boardNo = options.boardNo;

		$('#summernote').summernote({
			minHeight: 300,
		    toolbar: [
			    ['style', ['bold', 'italic', 'underline', 'clear']],
			    ['font', ['strikethrough', 'superscript', 'subscript']],
			    ['fontsize', ['fontsize']],
			    ['color', ['color']],
			    ['para', ['ul', 'ol', 'paragraph']],
			    ['height', ['height']],
			    ['insert', ['table']]
			],
			placeholder: '내용을 입력해주세요.',
			callbacks: {
				onInit: function() {
					if(options.isUpdate) {
						$('.board_section .board_title').val(options.board_title);
						$('#summernote').summernote('code', options.board_content);
					}
				}
			}
		});

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

		$('.board_btns > .cancel').click(function() {
			location.href = "/board";
		});

		$('.board_btns > .write').click(function() {
			var title = $('.board_title').val();
			var content = $('#summernote').summernote('code');
			console.log(content);

			if(!title || title.length == 0) {
				console.log("no title");
				return false;
			}

			if(self.isUpdate) {
				console.log(self.boardNo)
				if(self.boardNo > 0) {
					$.post('/board/update', {
						'title': title,
						'content': content,
						'boardNo': self.boardNo
					}, function(result) {
						console.log("resultc: ", result);
						if(result) {
							location.href = "/board";
						} else {
							console.log(result);
						}
					});
				} else {
					return false;
				}
			} else {
				$.post('/board/write', {
					'title': title,
					'content': content
				}, function(result) {
					if(result) {
						location.href = "/board";
					} else {
						console.log(result);
					}
				});
			}
		});
	}
};