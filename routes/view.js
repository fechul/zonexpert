var express = require('express');
var router = express.Router();

// 로그인 체크 함수
// router.get('/url', login_checker, function(req, res) {}) 형식으로 사용
var login_checker = function(req, res, next) {
	if (req.session.login) {
		next();
	} else {
		res.redirect('/');
	}
};

router.get('/', function(req, res) {
	var path = 'index.html';
	var json = {
		myinfo_display: '',
		logout_display: '',
		login_display: '',
		signup_display: '',
		mydata_display: ''
	};

	var session = true;
	if(session) {
		json.login_display = 'display:none;';
		json.signup_display = 'display:none;';
	} else {
		json.myinfo_display = 'display:none;';
		json.logout_display = 'display:none;';
		json.mydata_display = 'display:none;';
	}

    res.render(path, json);
});

router.get('/signup', function(req, res) {
	var path = 'signup.html';
	var json = {};

	res.render(path, json);
});

module.exports = router;
