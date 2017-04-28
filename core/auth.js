var db = {};
db.user = require('../db/user.js');

exports.join = function(data, callback) {
    var auth_join = {
        'result': false,
        'code': 0
    };

    db.user.find({
        'auth_token': data.token
    }, function(err, find) {
        if (err) {
            auth_join.code = 1;
            callback(auth_join);
        } else if (find.length === 1) {
            db.user.update({
                'auth_token': data.token
            }, {
                '$set': {
                    'auth_token': '',
                    'authed': true
                }
            }, function(err) {
                if (err) {
                    auth_join.code = 2;
                    callback(auth_join);
                } else {
                    auth_join.result = true;
                    callback(auth_join);
                }
            });
        } else {
            auth_join.code = 3;
            callback(auth_join);
        }
    });
};
