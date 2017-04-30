exports.signup = function(data, callback) {
    var auth_signup = {
        'result': false,
        'code': 0
    };

    db.user.find({
        'signup_auth_token': data.token
    }, function(err, find) {
        if (err) {
            auth_signup.code = 1;
            callback(auth_signup);
        } else if (find.length === 1) {
            db.user.update({
                'signup_auth_token': data.token
            }, {
                '$set': {
                    'signup_auth_token': '',
                    'authed': true
                }
            }, function(err) {
                if (err) {
                    auth_signup.code = 2;
                    callback(auth_signup);
                } else {
                    auth_signup.result = true;
                    callback(auth_signup);
                }
            });
        } else {
            auth_signup.code = 3;
            callback(auth_signup);
        }
    });
};
