var nodemailer = require('nodemailer');
var randomstring = require('randomstring');
var md5 = require('md5');
var async = require('async');

exports.login = function(data, callback) {
    var json = {
        'result': false,
        'code': 0,
        'email': '',
        'nickname': ''
    };

    //  code list
    //      0 : ok
    //      1 : email이 존재하지 않음
    //      2 : password가 일치하지 않음
    //      3 : 이메일 인증이 완료되지 않음

    db.user.find({
        'email': data.email
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
                    json.email = user_data.email;
                    json.nickname = user_data.nickname;
                }
            }
        } else {
            json.code = 1;
        }

        callback(json);
    });
};

exports.signup = function(data, callback) {
    this.validate(data, function(validation) {
        if (validation.result) {
            var signup_auth_token = randomstring.generate(30);
            var new_user = new db.user({
                'email': data.email,
                'nickname': data.nickname,
                'password': md5(data.password),
                'authed': false,
                'signup_auth_token': signup_auth_token,
                'signup_date': new Date(),
                'main_sport': data.main_sport,
                'main_league': data.main_league
            });

            new_user.save(function (err) {
                if (err) {
                    console.log(err);
                    callback(false);
                } else {
                    console.log('user.js:signup complete');
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
                                '<a href=',__url,'/auth/signup?token=',signup_auth_token,
                                '>인증하기</a>',
                            '</div>'
                        ].join('')
                    };

                    smtpTransport.sendMail(mailOptions, function(err, res) {
                        smtpTransport.close();
                        callback(validation);
                    });
                }
            });
        } else {
            callback(validation)
        }
    });
};

exports.changeInfo = function(options, callback) {
    var email = options.email;
    var nickname = options.nickname;
    var password = options.password;
    var password_check = options.password_check;

    var validation = {
        'result': false,
        'code': 0
    };

    db.user.find({
        'email': email
    }, {
        nickname: 1
    }).limit(1).exec(function(prevErr, prevData) {
        db.user.find({
            'nickname': nickname
        }, function(err, find) {
            if(err) {
                validation.code = 1;
            } else {
                if(find && find.length && prevData[0].nickname != nickname) {
                    validation.code == 11;
                } else {
                    var reg_nickname = /^[A-Za-z가-힣0-9]{2,12}$/;
                    var reg_password = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{6,20}$/;

                    if (nickname.length < 2 || nickname.length > 12) {
                        validation.code = 31;
                    } else if (!reg_nickname.test(nickname)) {
                        validation.code = 32;
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
            }

            if(validation.result) {
                db.user.update({
                    'email': email
                }, {
                    $set: {
                        'nickname': nickname,
                        'password': md5(password)
                    }
                }, function(updateErr) {
                    if(updateErr) {
                        validation.result = false;
                        validation.code = 1;
                    }
                    callback(validation);
                });
            } else {
                callback(validation);
            }
        });
    });
};

exports.validate = function(data, callback) {
    var email = data.email || '';
    var nickname = data.nickname || '';
    var password = data.password || '';
    var password_check = data.password_check || '';
    var main_sport = data.main_sport;
    var main_league = data.main_league;

    var validation = {
        'result': false,
        'code': 0
    };

    //  code list
    //      0   :   ok
    //      1   :   db find error
    //      11  :   nickname 중복
    //      12  :   email 중복
    //      21  :   email 양식이 맞지 않음
    //      31  :   nickname 길이가 2~12이 아님
    //      32  :   nickname 양식이 맞지 않음
    //      41  :   password가 password_check과 다름
    //      42  :   password 길이가 8~20이 아님
    //      43  :   password 공백이 있음
    //      44  :   password 양식이 맞지 않음

    db.user.find({
        '$or': [
            {
                'nickname': nickname
            },
            {
                'email': email
            }
        ]
    }, function(err, find) {
        if (err) {  // 에러 체크
            validation.code = 1;
        } else if (find.length) { // 중복 nickname, email
            if (find[0].nickname === nickname) {
                validation.code = 11;
            } else if (find[0].email === email) {
                validation.code = 12;
            }
        } else {    // 유효성 체크
            var reg_nickname = /^[A-Za-z가-힣0-9]{2,12}$/;
            var reg_email = /^[\w]{4,}@[\w]+(\.[\w-]+){1,3}$/;
            var reg_password = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{6,20}$/;

            if (!reg_email.test(email)) {
                validation.code = 21;
            } else if (nickname.length < 2 || nickname.length > 12) {
                validation.code = 31;
            } else if (!reg_nickname.test(nickname)) {
                validation.code = 32;
            } else if (password !== password_check) {
                validation.code = 41;
            } else if (password.length < 8 || password.length > 20) {
                validation.code = 42;
            } else if (password.search(/\s/) != -1) {
                validation.code = 43;
            } else if (!reg_password.test(password)) {
                validation.code = 44;
            } else if(!main_sport || main_sport == 'none' || isNaN(parseInt(main_sport))) {
                validation.code = 51;
            } else if(!main_league || main_league == 'none' || isNaN(parseInt(main_league))) {
                validation.code = 52;
            } else {
                validation.result = true;
            }
        }

        callback(validation);
    });
};

exports.get_rank_data = function(users, callback) {
    var userdata_array = [];

    async.mapSeries(users, function(user, async_cb) {
        db.user.find({
            'email': user
        }, {
            'nickname': 1,
            'rating': 1,
            'record': 1,
            'main_sport': 1,
            'main_league': 1,
            'readyGameCnt': 1
        }).limit(1).exec(function(err, userdata) {
            if(userdata && userdata.length) {
                userdata = userdata[0];

                userdata_array.push({
                    'nickname': userdata.nickname,
                    'rating': userdata.rating,
                    'record': userdata.record,
                    'main_sport': userdata.main_sport,
                    'main_league': userdata.main_league,
                    'readyGameCnt': userdata.readyGameCnt
                });
            }
            async_cb();
        });
    }, function(async_err) {
        callback(userdata_array);
    });
};

exports.get_email = function(user, callback) {
    db.user.find({
        'nickname': user
    }, {
        'email': 1
    }, function(err, data) {
        if(data && data.length) {
            data = data[0];
            callback(data.email);
        } else {
            callback(null);
        }
    });
};

exports.get = function(nick, callback) {
    db.user.find({
        '$or': [
            {
                'nickname': nick
            },
            {
                'email': nick
            }
        ]
    }).limit(1).exec(function(err, data) {
        if(data && data.length) {
            data = data[0];
            callback(data);
        } else {
            db.user.find({
                'email': nick
            }).limit(1).exec(function(err, _data) {
                if(_data && _data.length) {
                    _data = _data[0];

                    callback(_data);
                } else {
                    callback(null);
                }
            });
        }
    });
};

exports.countAllUsers = function(callback) {
    db.user.count({}, function(err, length) {
        callback(length);
    });
};

exports.checkAttendancePoint = function(email, callback) {
    db.user.find({
        'email': email
    }, {
        'todayAttendancePoint': 1,
        'point': 1
    }).limit(1).exec(function(err, userData) {
        if(err) {
            callback({
                attendancePointUpdated: false,
                point: 0
            });
        } else {
            if(userData && userData.length) {
                userData = userData[0];

                if(!userData.todayAttendancePoint) {
                    var atPoint = 100;
                    var atPointLog = {
                        'amount': atPoint,
                        'classification': 'attendance',
                        'time': new Date()
                    };

                    db.user.update({
                        'email': email
                    }, {
                        $set: {
                            'todayAttendancePoint': true
                        },
                        $inc: {
                            'point': atPoint
                        },
                        $addToSet: {
                            'pointLog': atPointLog
                        }
                    }, function(err) {
                        callback({
                            attendancePointUpdated: err ? false : true,
                            point: err ? userData.point : userData.point + atPoint
                        });
                    });
                } else {
                    callback({
                        attendancePointUpdated: false,
                        point: userData.point
                    });
                }
            } else {
                callback({
                    attendancePointUpdated: false,
                    point: 0
                });
            }
        }
    });
};

