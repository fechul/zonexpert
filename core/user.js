var nodemailer = require('nodemailer');

var user = require('../db/user.js');

exports.join = function(data, callback) {
    this.validate(data, function(validation) {
        if (validation.result) {
            var new_user = new user({
                'id': data.id,
                'email': data.email,
                'password': data.password,
                'authed': false,
                'auth_token': '',
                'join_date': new Date()
            });

            new_user.save(function (err) {
                if (err) {
                    console.log(err);
                    callback(false);
                } else {
                    console.log('user.js:join complete');
                    callback(true);
                }
            });
        } else {
            callback(validation)
        }
    });
};

exports.validate = function(data, callback) {
    var id = data.id || '';
    var email = data.email || '';
    var password = data.password || '';
    var password_check = data.password_check || '';

    var validation = {
        'result': false,
        'code': 0
    };

    user.find({
        '$or': [
            {
                'id': id
            },
            {
                'email': email
            }
        ]
    }, function(err, find) {
        if (err) {  // 에러 체크
            validation.code = 1;
        } else if (find.length) { // 중복 id, email
            if (find[0].id === id) {
                validation.code = 11;
            } else if (find[0].email === email) {
                validation.code = 12;
            }
        } else {    // 유효성 체크
            var reg_id = /^[a-z][a-z0-9]{5,15}$/;
            var reg_email = /^[\w]{4,}@[\w]+(\.[\w-]+){1,3}$/;
            var reg_password = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{6,20}$/;

            if (id.length < 6 || id.length > 16) {
                validation.code = 21;
            } else if (!reg_id.test(id)) {
                validation.code = 22;
            } else if (password !== password_check) {
                validation.code = 41;
            } else if (password.length < 8 || password.length > 20) {
                validation.code = 42;
            } else if (password.search(/\s/) != -1) {
                validation.code = 43;
            } else if (!reg_password.test(password)) {
                validation.code = 44;
            } else {
                validation.result = true;
            }
        }

        if (validation.result) {
            var smtpTransport = nodemailer.createTransport({
                'service': 'gmail',
                'auth': {
                    'user': 'zonexpert0@gmail.com',
                    'pass': 'whsansrk123!'
                }
            });

            var mailOptions = {
                'from': '존문가닷컴 <zonexpert0@gmail.com>',
                'to': email,
                'subject': '존문가닷컴 회원가입 인증메일',
                'text': 'test'
            };

            smtpTransport.sendMail(mailOptions, function(err, res) {
                smtpTransport.close();
                callback(validation);
            });
        } else {
            callback(validation);
        }
    });
};
