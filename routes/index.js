var user = require('../core/user.js');
var auth = require('../core/auth.js');

exports.join = function(req, res) {
	user.join({
		'id': req.body.id,
		'email': req.body.email,
		'password': req.body.password,
		'password_check': req.body.password_check
	}, function(result) {
		res.json(result);
	});
};

exports.auth = {};

exports.auth.join = function(req, res) {
	auth.join({
		'token': req.query.token
	}, function(response) {
		console.log(response);
		if (response.result) {
			res.redirect('/');
		} else {
			res.redirect('/');
		}
	});
};
