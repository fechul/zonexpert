var nodemailer = require('nodemailer');
var randomstring = require('randomstring');
var md5 = require('md5');

var db = {};
db.user = require('../db/user.js');

exports.login = function(data, callback) {
    var json = {
        'result': false,
        'code': 0,
        'id': '',
        'email': ''
    };

    //  code list
    //      0 : ok
    //      1 : id가 존재하지 않음
    //      2 : password가 일치하지 않음
    //      3 : 이메일 인증이 완료되지 않음

    db.user.find({
        'id': data.id
    })
    .limit(1)
    .exec(function(err, _data) {
        if (_data.length) {
            var user_data = _data[0];

            if (user_data.password != md5(data.password)) {
                json.code = 2;
            } else {
                if (!user_data.authed) {
                    json.code = 3;
                } else {
                    json.result = true
                    json.id = user_data.id;
                    json.email = user_data.email;
                }
            }
        } else {
            json.code = 1;
        }

        res.json(json);
    });
};

exports.join = function(data, callback) {
    this.validate(data, function(validation) {
        if (validation.result) {
            var auth_token = randomstring.generate(30);
            var new_user = new db.user({
                'id': data.id,
                'email': data.email,
                'password': md5(data.password),
                'authed': false,
                'auth_token': auth_token,
                'join_date': new Date()
            });

            new_user.save(function (err) {
                if (err) {
                    console.log(err);
                    callback(false);
                } else {
                    console.log('user.js:join complete');
                    var smtpTransport = nodemailer.createTransport({
                        'service': 'gmail',
                        'auth': {
                            'user': __admin_email,
                            'pass': __admin_password
                        }
                    });

                    var mailOptions = {
                        'from': '존문가닷컴 <' + __admin_email + '>',
                        'to': data.email,
                        'subject': '존문가닷컴 회원가입 인증메일',
                        'html': [
                            '<div>',
                                '안녕하세요 존문가닷컴입니다.<br>',
                                '회원가입을 위한 이메일 인증 과정입니다.<br>',
                                '아래의 링크를 클릭하면 인증이 완료됩니다.<br><br>',
                                '<a href=',__url,'/auth/join?token=',auth_token,
                                '>인증하기</a>',
                            '</div>'
                        ].join('')
                    };

                    console.log(mailOptions);

                    smtpTransport.sendMail(mailOptions, function(err, res) {
                        smtpTransport.close();
                        callback(true);
                    });
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

    //  code list
    //      0   :   ok
    //      1   :   db find error
    //      11  :   id 중복
    //      12  :   email 중복
    //      21  :   id 길이가 6~16이 아님
    //      22  :   id 양식이 맞지 않음
    //      41  :   password가 password_check과 다름
    //      42  :   password 길이가 8~20이 아님
    //      43  :   password 공백이 있음
    //      44  :   password 양식이 맞지 않음

    db.user.find({
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

        callback(validation);
    });
};
