var express = require('express');
var router = express.Router();

var board = require('../core/board.js');

// 로그인 상태에서만 접속 가능한 페이지 체크
// router.get('/url', need_login, function(req, res) {}) 형식으로 사용
var need_login = function(req, res, next) {
	if (req.session.login) {
		next();
	} else {
		res.redirect('/');
	}
};

// 로그인 상태에서 접속 불가능한 페이지 체크
var no_login = function(req, res, next) {
	if (req.session.login) {
		res.redirect('/');
	} else {
		next();
	}
}

router.get('/', function(req, res) {
	var path = 'index.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: ''
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

    res.render(path, json);
});

router.get('/signup', no_login, function(req, res) {
	var path = 'signup.html';
	var json = {};

	res.render(path, json);
});

router.get('/login', no_login, function(req, res) {
	var path = 'login.html';
	var json = {};

	res.render(path, json);

});

router.get('/rank', function(req, res) {
	var path = 'rank.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: ''
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	res.render(path, json);
});

router.get('/board', function(req, res) {
	var path = 'board.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		user_email: req.session.email
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	res.render(path, json);
});

router.get('/board/write', need_login, function(req, res) {
	var boardNo = req.query.no;
	var path = 'board_write.html';

	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: '',
		boardNo: (boardNo || -1),
		board_title: '',
		board_content: '',
		isUpdate: false,
		write_btn_name: ''
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	if(boardNo) {	//update
		json.write_btn_name = '수정하기';
		board.get_content(boardNo, function(board_data) {
			if(board_data.writer == req.session.email) {
				json.board_title = board_data.title;
				json.board_content = board_data.content;
				json.isUpdate = true;
				res.render(path, json);
			} else {
				res.json(false);
			}
		});
	} else {	//new write
		json.write_btn_name = '작성하기';
		res.render(path, json);
	}
});

router.get('/schedule', function(req, res) {
	var path = 'schedule.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: ''
	};

	if(req.session.login) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

	res.render(path, json);
});

module.exports = router;
