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
                            '<div style="border:1px solid #ccc; padding:20px; max-width:500px; margin:50px auto; border-radius:10px; text-align:center; background:linear-gradient(27deg, #151515 5px, transparent 5px) 0 5px,   linear-gradient(207deg, #151515 5px, transparent 5px) 10px 0px,   linear-gradient(27deg, #222 5px, transparent 5px) 0px 10px,   linear-gradient(207deg, #222 5px, transparent 5px) 10px 5px,   linear-gradient(90deg, #1b1b1b 10px, transparent 10px),   linear-gradient(#1d1d1d 25%, #1a1a1a 25%, #1a1a1a 50%, transparent 50%, transparent 75%, #242424 75%, #242424); background-size:20px 20px; background-color:#131313;">',
                                '<div style="color:#fff !important;"><div style="font-size:48px;font-weight:bold;">존문가닷컴</div><div style="font-size:30px;font-weight:bold;">Zonexperts</div></div><div style="font-size:20px;margin-top:30px; color:#fff !important">회원가입 인증메일입니다.</div><br>',
                                '<p style="color:#fff !important;">아래의 링크를 클릭하면 인증이 완료됩니다.</p><br>',
                                '<a href=',__url,'/auth/signup?token=',signup_auth_token,' style="font-size:22px; color:#fff;">인증하기</a>',
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
            // var reg_email = /^[\w]{4,}@[\w]+(\.[\w-]+){1,3}$/;
            var reg_email = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
            var reg_password = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{6,20}$/;

            if (!reg_email.test(email)) {
                validation.code = 21;
            } else if (password !== password_check) {
                validation.code = 41;
            } else if (password.length < 8 || password.length > 20) {
                validation.code = 42;
            } else if (password.search(/\s/) != -1) {
                validation.code = 43;
            } else if (!reg_password.test(password)) {
                validation.code = 44;
            } else if (nickname.length < 2 || nickname.length > 12) {
                validation.code = 31;
            } else if (!reg_nickname.test(nickname)) {
                validation.code = 32;
            } else if(!main_sport || main_sport == 'none') {
                validation.code = 51;
            } else if(!main_league || main_league == 'none') {
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
            'email': 1,
            'nickname': 1,
            'rating': 1,
            'record': 1,
            'main_sport': 1,
            'main_league': 1,
            'readyGameCnt': 1,
            'record': 1
        }).limit(1).exec(function(err, userdata) {
            if(userdata && userdata.length) {
                userdata = userdata[0];

                userdata_array.push({
                    'email': userdata.email,
                    'nickname': userdata.nickname,
                    'rating': userdata.rating,
                    'record': userdata.record,
                    'main_sport': userdata.main_sport,
                    'main_league': userdata.main_league,
                    'readyGameCnt': userdata.readyGameCnt,
                    'record': userdata.record
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

exports.get_nickname = function(email, callback) {
    db.user.find({
        'email': email
    }, {
        'nickname': 1
    }, function(err, data) {
        if(data && data.length) {
            data = data[0];
            callback(data.nickname);
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

exports.countAllUsers = function(option, callback) {
    var query = {};
    if(option && option == 'onlyRanked') {    // without ready players
        query = {
            'readyGameCnt': {
                $lt: 1
            }
        }
    }
    db.user.count(query, function(err, length) {
        callback(length);
    });
};

exports.getPoint = function(email, callback) {
    db.user.find({
        'email': email,
    }, {
        'freePoint': 1,
        'point': 1
    }).limit(1).exec(function(err, userData) {
        var json = {
            'freePoint': 0,
            'point': 0
        };

        if (!err && userData && userData.length) {
            json.freePoint = userData[0].freePoint;
            json.point = userData[0].point;
        }

        callback(json);
    });
};

exports.getPointLog = function(options, callback) {
    var email = options.email;
    var type = options.type;
    var pageNo = options.pageNo;

    var _limit = 5;
    var _skip = _limit*(pageNo-1);

    var query = {
        'userEmail': email
    };

    if(type != 'use' && type != 'earn' && type != 'charge') {
        callback(false);
    } else {
        if(type == 'use') {
            query.classification = 'use';
        } else if(type == 'earn') {
            query.classification = 'earn';
        } else if(type == 'charge') {
            query.classification = {
                $in: ['charge', 'attendance']
            };
        }

        db.point.count(query, function(countErr, length) {
            db.point.find(query).sort({'time': -1}).skip(_skip).limit(5).exec(function(err, logs) {
                callback({
                    logs: logs,
                    totalPage: Math.ceil(length/5)
                });
            });
        });
    }
};

exports.checkPoint = function(email, callback) {
    db.user.find({
        'email': email
    }, {
        'todayAttendancePoint': 1,
        'freePoint': 1,
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
                    var atPointLog = new db.point({
                        'userEmail': email,
                        'amount': atPoint,
                        'pointType': 'free',
                        'classification': 'attendance',
                        'time': new Date()
                    });

                    db.user.update({
                        'email': email
                    }, {
                        $set: {
                            'todayAttendancePoint': true
                        },
                        $inc: {
                            'freePoint': atPoint
                        }
                    }, function(err) {
                        if(err) {
                            callback({
                                attendancePointUpdated: false,
                                point: userData.point + userData.freePoint
                            });
                        } else {
                            atPointLog.save(function(pointErr) {
                                callback({
                                    attendancePointUpdated: true,
                                    point: userData.point + userData.freePoint + atPoint
                                });
                            });
                        }
                    });
                } else {
                    callback({
                        attendancePointUpdated: false,
                        point: userData.freePoint + userData.point
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

exports.usePoint = function(options, callback) {
    var email = options.email;
    var point = options.point;
    var pointType = options.pointType;
    var type = options.type; // charge, view(use), system(use), earn, attendance
    var target = options.target;
    var matchId = options.matchId;

    db.user.find({
        'email': email
    }, {
        'freePoint': 1,
        'point': 1
    }).limit(1).exec(function(err, userData) {
        if(userData && userData.length) {
            userData = userData[0];

            var targetPoint;
            if (pointType == 'free') {
                targetPoint = userData.freePoint;
            } else {
                targetPoint = userData.point;
            }

            if(targetPoint >= point) {
                var updatedPoint;
                var setQuery = {};

                if (pointType == 'free') {
                    updatedPoint = userData.freePoint - point;
                    setQuery.freePoint = updatedPoint;
                    setQuery.point = userData.point;
                } else {
                    updatedPoint = userData.point - point;
                    setQuery.freePoint = userData.freePoint;
                    setQuery.point = updatedPoint;
                }

                var pointLog = {
                    'userEmail': email,
                    'amount': point,
                    'pointType': (pointType == 'free' ? 'free' : 'currency'),
                    'classification': (type == 'view' || type == 'system' ? 'use' : type),
                    'time': new Date()
                };

                if(pointLog.classification == 'use') {
                    pointLog.useClassification = type;
                }

                if(pointLog.classification == 'use' || pointLog.classification == 'earn') {
                    pointLog.matchId = matchId;
                    if(type !== 'system') {
                        pointLog.target = target;
                    }
                }

                var newPointLog = new db.point(pointLog);

                db.user.update({
                    'email': email
                }, {
                    $set: setQuery
                }, function(updateErr) {
                    if(updateErr) {
                        callback(false);
                    } else {
                        newPointLog.save(function(pointErr) {
                            callback(true);
                        });
                    }
                });
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

exports.earnPoint = function(options, callback) {
    var email = options.email;
    var point = options.point;
    var type = options.type; // charge, view(use), system(use), earn, attendance
    var target = options.target;
    var matchId = options.matchId;

    db.user.find({
        'email': email
    }, {
        'point': 1
    }).limit(1).exec(function(err, userData) {
        if(userData && userData.length) {
            userData = userData[0];

            var updatedPoint = userData.point + point;

            var pointLog = {
                'userEmail': email,
                'amount': point,
                'pointType': 'currency',
                'classification': (type == 'view' || type == 'system' ? 'use' : type),
                'time': new Date()
            };

            if(pointLog.classification == 'use') {
                pointLog.useClassification = type;
            }

            if(pointLog.classification == 'use' || pointLog.classification == 'earn') {
                pointLog.matchId = matchId;
                if(type !== 'system') {
                    pointLog.target = target;
                }
            }

            var newPointLog = db.point(newPointLog);

            db.user.update({
                'email': email
            }, {
                $set: {
                    'point': updatedPoint
                }
            }, function(updateErr) {
                if(updateErr) {
                    callback(false);
                } else {
                    newPointLog.save(function(pointErr) {
                        callback(true);
                    });
                }
            });
        } else {
            callback(false);
        }
    });
};

exports.returnPoint = function(options, callback) {
    var email = options.email;
    var point = options.point;
    var pointType = options.pointType;
    var type = options.type; // charge, view(use), system(use), earn, attendance
    var target = options.target;
    var matchId = options.matchId;

    var classification = (type == 'view' || type == 'system' ? 'use' : type);

    db.point.remove({
        'userEmail': email,
        'amount': point,
        'target': target,
        'matchId': matchId,
        'classification': classification
    }, function(err, remove) {
        var incQuery = {};
        if (pointType == 'free') {
            incQuery.freePoint = point;
        } else {
            incQuery.point = point;
        }        

        db.user.update({
            'email': email
        }, {
            $inc: incQuery
        }, function(_err, inc) {
            if(_err) {
                callback(false);
            } else {
                callback(true);
            }
        });
    });
};

exports.leave = function(options, callback) {
    var email = options.email;
    var leaveReason = options.leaveReason;

    db.user.find({
        'email': email
    }).limit(1).exec(function(err, data) {
        if(data && data.length) {
            db.user.remove({
                'email': email
            }, function(_err, remove) {
                db.board.remove({
                    'writer': email
                }, function(__err, boardRemove) {
                    if(remove) {
                        var smtpTransport = nodemailer.createTransport({
                            'service': 'gmail',
                            'auth': {
                                'user': __admin_email,
                                'pass': __admin_password
                            }
                        });

                        var mailOptions = {
                            'from': '존문가닷컴 <' + __admin_email + '>',
                            'to': __admin_email,
                            'subject': '회원 탈퇴: ' + email,
                            'html': [
                                '<div>',
                                    '-----탈퇴 계정-----<br>',
                                    '이메일: ' + email + '<br>',
                                    '탈퇴 사유: ' + leaveReason,
                                '</div>'
                            ].join('')
                        };

                        smtpTransport.sendMail(mailOptions, function(__err, res) {
                            smtpTransport.close();
                            callback(true);
                        });
                    } else {
                        callback(false);
                    }
                });
            });
        } else {
            callback(false);
        }
    });
};

exports.getPredictSystemData = function(params, callback) {
    var matchId = params.matchId;
    var leagueId = params.leagueId;
    var sportsId = params.sportsId;
    var predictionObj = {};

    db.prediction.find({
        'matchId': matchId,
        'confirmed': true
    }).exec(function(err, predictions) {
        var userList = [];
        if (!err && predictions.length) {
            for (var i = 0; i < predictions.length; i++) {
                predictionObj[predictions[i].userEmail] = {
                    'pick': predictions[i].pick
                };

                userList.push(predictions[i].userEmail);
            }

            db.user.find({
                'readyGameCnt': 0,
                'email': {
                    '$in': userList
                }
            }).exec(function(err, users) {
                if (users.length) {
                    var hit = 0;
                    var fail = 0;

                    for (var j = 0; j < users.length; j++) {
                        users[j] = {
                            'email': users[j].email,
                            'record': users[j].record
                        };

                        if (users[j].record && users[j].record[sportsId] && users[j].record[sportsId].total) {
                            sports_hit = users[j].record[sportsId].total.hit;
                            sports_fail = users[j].record[sportsId].total.fail;

                            if (sports_hit + sports_fail > 0) {
                                users[j].sportsHitRate = sports_hit / (sports_hit + sports_fail);
                            } else {
                                users[j].sportsHitRate = 0;
                            }

                            if (users[j].record[sportsId][leagueId]) {
                                league_hit = users[j].record[sportsId][leagueId].hit;
                                league_fail = users[j].record[sportsId][leagueId].fail;

                                if (league_hit + league_fail > 0) {
                                    users[j].leagueHitRate = league_hit / (league_hit + league_fail);
                                } else {
                                    users[j].leagueHitRate = 0;
                                }
                            } else {
                                users[j].leagueHitRate = 0.5;
                            }
                        } else {
                            users[j].sportsHitRate = 0.5;
                        }
                    }

                    var pickCounts = {
                        'home': 0,
                        'draw': 0,
                        'away': 0
                    };

                    for (var j = 0; j < users.length; j++) {
                        pickCounts[predictionObj[users[j].email].pick] += users[j].sportsHitRate;
                        pickCounts[predictionObj[users[j].email].pick] += users[j].leagueHitRate;
                    }

                    var predictionSystemPick = '';

                    if (pickCounts.home > pickCounts.away) {
                        if (pickCounts.home > pickCounts.draw) {
                            predictionSystemPick = 'home';
                        } else if (pickCounts.home == pickCounts.draw) {
                            predictionSystemPick = 'homeORdraw';
                        } else {
                            predictionSystemPick = 'draw';
                        }
                    } else if (pickCounts.home < pickCounts.away) {
                        if (pickCounts.away > pickCounts.draw) {
                            predictionSystemPick = 'away';
                        } else if (pickCounts.away == pickCounts.draw) {
                            predictionSystemPick = 'awayORdraw';
                        } else {
                            predictionSystemPick = 'draw';
                        }
                    } else {
                        if (pickCounts.home > pickCounts.draw) {
                            predictionSystemPick = 'homeORaway';
                        } else {
                            predictionSystemPick = 'draw';
                        }
                    }

                    var sumPickRate = pickCounts.home + pickCounts.draw + pickCounts.away;

                    var detailWinRate = {
                        'home': 100 * pickCounts.home / sumPickRate,
                        'draw': 100 * pickCounts.draw / sumPickRate,
                        'away': 100 * pickCounts.away / sumPickRate
                    };

                    callback({
                        'result': true,
                        'pick': predictionSystemPick,
                        'detail': detailWinRate
                    });
                } else {
                    callback({
                        'result': false
                    });
                }
            });
        } else {
            callback({
                'result': false
            });
        }
    });
};

exports.getPointTypeData = function(email, callback) {
    var useCnt = 0;
    var earnCnt = 0;
    var useAmount = 0;
    var earnAmount = 0;

    async.parallel([
        //use
        function(_callback){
            db.point.aggregate([
                { 
                    $match: {
                        'userEmail': email,
                        'classification': 'use'
                    } 
                },
                { 
                    $group: { 
                        _id: null,
                        totalCnt: {
                            $sum: 1
                        },
                        totalAmount: {
                            $sum: "$amount" 
                        } 
                    } 
                }
            ], function(err, data) {
                if(data && data.length) {
                    useCnt = data[0].totalCnt;
                    useAmount = data[0].totalAmount;
                }
                _callback(null);
            });
        },
        //earn
        function(_callback){
            db.point.aggregate([
                { 
                    $match: {
                        'userEmail': email,
                        'classification': 'earn'
                    } 
                },
                { 
                    $group: { 
                        _id: null,
                        totalCnt: {
                            $sum: 1
                        },
                        totalAmount: {
                            $sum: "$amount" 
                        }
                    } 
                }
            ], function(err, data) {
                if(data && data.length) {
                    earnCnt = data[0].totalCnt;
                    earnAmount = data[0].totalAmount;
                }
                _callback(null);
            });
        }
    ], function(err, results){
        if(err) {
            console.log("err: ", err);
            callback(null);
        } else {
            callback({
                useCnt: useCnt,
                earnCnt: earnCnt,
                useAmount: useAmount,
                earnAmount: earnAmount
            });
        }
    });
};
