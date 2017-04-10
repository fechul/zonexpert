
/*
 * GET home page.
 */

exports.index = function(req, res){
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
};