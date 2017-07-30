var async = require('async');

exports.add = function(data, callback) {
    var currentDate = new Date();
    db.match.find({
        'id': data.matchId
    })
    .limit(1)
    .exec(function(err, matchData) {
        if (matchData.length) {
            matchData = matchData[0];

            var matchDate = new Date(matchData.date);
            var fiveDaysLater = currentDate.getFullYear() + '-' + (currentDate.getMonth()+1) + '-' + (currentDate.getDate()+5);
            fiveDaysLater = new Date(fiveDaysLater);

            if(currentDate >= matchDate) {
                callback({
                    result: false,
                    err_code: 1
                });
            } else if(matchDate >= fiveDaysLater) {
                callback({
                    result: false,
                    err_code: 2
                });
            } else {
                db.prediction.find({
                    'userEmail': data.userEmail,
                    'matchId': data.matchId
                }).exec(function(err, predictionData) {
                    if (predictionData.length == 0) {
                        var newPrediction = new db.prediction({
                            'userEmail': data.userEmail,
                            'createTime': new Date(),
                            'matchId': matchData.id,
                            'leagueId': matchData.leagueId,
                            'sportsId': matchData.sportsId,
                            'teamList': [matchData.homeTeamId, matchData.awayTeamId],
                            'confirmed': false
                        });

                        newPrediction.save(function(save_err) {
                            if(save_err) {
                                callback(false);
                            } else {
                                callback({
                                    'result': true
                                });
                            }
                        });
                    } else {
                        callback(false);
                    }
                });
            }
        } else {
            callback(false);
        }
    });
};

exports.del = function(data, callback) {
    db.prediction.remove({
        'userEmail': data.userEmail,
        'matchId': data.matchId,
        'confirmed': false
    }).exec(function(err) {
        if(err) {
            callback(false);
        } else {
            callback({
                result: true
            });
        }
    });
};

exports.confirm = function(data, callback) {
    var userEmail = data.userEmail;

    db.prediction.count({
        'userEmail': userEmail,
        'confirmed': true,
        'result': 'wait'
    }, function(predictLengthErr, predictLength) {
        var totalPredictLength = data.predictions.length + predictLength;
        if(totalPredictLength && totalPredictLength > 10) {
            callback({
                'result': false,
                'err_code': 10
            });
        } else {
            async.each(data.predictions, function(prediction, async_callback) {
                db.match.find({
                    'id': prediction.matchId
                })
                .limit(1)
                .exec(function(err, matchData) {
                    if (matchData.length == 1) {
                        matchData = matchData[0];
                        var pickCount = matchData.pickCount;
                        if (!pickCount) {
                            pickCount = {
                                'home': 0,
                                'draw': 0,
                                'away': 0
                            };
                        }

                        db.prediction.find({
                            'userEmail': userEmail,
                            'matchId': matchData.id
                        })
                        .limit(1)
                        .exec(function(_err, predictionData) {
                            if (predictionData.length) {
                                predictionData = predictionData[0];
                                if (predictionData.confirmed == true) {
                                    // 이미 예측 한 데이터
                                    async_callback();
                                } else if ((matchData.status == 'IN_PLAY') || (matchData.status == 'FINISHED')) {
                                    // 이미 시작한 경기
                                    db.prediction.remove({
                                        'userEmail': userEmail,
                                        'matchId': matchData.matchId
                                    }, function(result) {
                                        async_callback();
                                    });
                                } else {
                                    // 업데이트 가능
                                    db.prediction.update({
                                        'userEmail': userEmail,
                                        'matchId': matchData.id
                                    }, {
                                        '$set': {
                                            'confirmed': true,
                                            'confirmedTime': new Date(),
                                            'pick': prediction.pick,
                                            'result': 'wait'
                                        }
                                    }).exec(function(err) {
                                        pickCount[prediction.pick]++;
                                        db.match.update({
                                            'id': prediction.matchId
                                        }, {
                                            '$set': {
                                                'pickCount': pickCount
                                            }
                                        }).exec(function() {
                                            async_callback();
                                        });
                                    });
                                }
                            } else {
                                // 존재하지 않는 장바구니
                                async_callback();
                            }
                        });
                    } else {
                        // 존재하지 않는 경기
                        async_callback();
                    }
                });
            }, function(err, result) {
                callback({
                    'result':true
                });
            });
        }
    });
};

exports.get = function(data, callback) {
    var findJson = {
        'userEmail': data.userEmail,
        'confirmed': true
    };

    if (data.leagueId) {
        findJson.leagueId = data.leagueId;
    }

    if (data.result) {
        findJson.result = data.result;
    }

    if (data.ratingCalculatedTime) {
        findJson.ratingCalculatedTime = data.ratingCalculatedTime;
    }

    db.prediction.find(findJson, {
        'matchId': 1,
        'confirmed': 1,
        'result': 1,
        'pick': 1
    }).exec(function(err, result) {
        callback(result);
    });
};

exports.getAll = function(data, callback) {
    var findJson = {
        'userEmail': data.userEmail
    };

    if (data.leagueId) {
        findJson.leagueId = data.leagueId;
    }

    db.prediction.find(findJson, {
        'matchId': 1,
        'confirmed': 1,
        'result': 1
    }).exec(function(err, result) {
        callback(result);
    });
};

exports.getBasketList = function(data, callback) {
    var findJson = {
        'userEmail': data.userEmail,
        'confirmed': false
    };

    if (data.leagueId) {
        findJson.leagueId = data.leagueId;
    }

    db.prediction.find(findJson, {
        'matchId': 1,
        'confirmed': 1,
        'pick': 1
    }).exec(function(err, result) {
        callback(result);
    });
};

exports.getRatingChange = function(dates, callback) {
    async.map(dates, function(date, async_cb) {


        async_cb();
    }, function(async_err) {
        callback(null);
    });
};

exports.getMatchesStatistics = function(data, callback) {
    var nick = data.nick;
    var type = data.type;

    var userStatistics = {};

    db.user.find({
        $or: [{
            'nickname': nick
        }, {
            'email': nick
        }]
    }, {
        'email': 1
    }).limit(1).exec(function(userErr, userData) {
        if(userErr) {
            callback(null);
        } else {
            if(userData && userData.length) {
                userData = userData[0];

                var email = userData.email;

                db.prediction.find({
                    'userEmail': email,
                    'confirmed': true,
                    'result': {
                        $in: ['true', 'false']
                    }
                }, function(predictErr, predictData) {
                    if(predictErr) {
                        callback(null);
                    } else {
                        if(predictData && predictData.length) {
                            if(type == 'sport') {
                                async.each(predictData, function(eachData, async_cb) {
                                    if(!userStatistics[eachData.sportsId]) {
                                        userStatistics[eachData.sportsId] = {
                                            'hit': 0,
                                            'fail': 0,
                                            'game_cnt': 0,
                                            'sportsId': eachData.sportsId
                                        };
                                    }

                                    if(eachData.result == 'true') {
                                        userStatistics[eachData.sportsId].hit++;
                                        userStatistics[eachData.sportsId].game_cnt++;
                                    } else if(eachData.result == 'false') {
                                        userStatistics[eachData.sportsId].fail++;
                                        userStatistics[eachData.sportsId].game_cnt++;
                                    }

                                    async_cb();
                                }, function(async_err) {
                                    if(async_err) {
                                        callback(null);
                                    } else {
                                        for(var key in userStatistics) {
                                            userStatistics[key].rate = ((userStatistics[key].hit/userStatistics[key].game_cnt)*100).toFixed(2);
                                        }
                                        callback(userStatistics);
                                    }
                                });
                            } else if(type == 'league') {
                                async.each(predictData, function(eachData, async_cb) {
                                    if(!userStatistics[eachData.leagueId]) {
                                        userStatistics[eachData.leagueId] = {
                                            'hit': 0,
                                            'fail': 0,
                                            'game_cnt': 0,
                                            'leagueId': eachData.leagueId
                                        };
                                    }

                                    if(eachData.result == 'true') {
                                        userStatistics[eachData.leagueId].hit++;
                                        userStatistics[eachData.leagueId].game_cnt++;
                                    } else if(eachData.result == 'false') {
                                        userStatistics[eachData.leagueId].fail++;
                                        userStatistics[eachData.leagueId].game_cnt++;
                                    }

                                    async_cb();
                                }, function(async_err) {
                                    if(async_err) {
                                        callback(null);
                                    } else {
                                        for(var key in userStatistics) {
                                            userStatistics[key].rate = ((userStatistics[key].hit/userStatistics[key].game_cnt)*100).toFixed(2);
                                        }
                                        callback(userStatistics);
                                    }
                                });
                            } else {    //club
                                async.each(predictData, function(eachData, async_cb) {
                                    var teamList = eachData.teamList;
                                    async.each(teamList, function(team, _async_cb) {
                                        if(!userStatistics[team]) {
                                            userStatistics[team] = {
                                                'hit': 0,
                                                'fail': 0,
                                                'game_cnt': 0,
                                                'teamId': team,
                                                'teamName': null
                                            };
                                        }

                                        if(eachData.result == 'true') {
                                            userStatistics[team].hit++;
                                            userStatistics[team].game_cnt++;
                                        } else if(eachData.result == 'false') {
                                            userStatistics[team].fail++;
                                            userStatistics[team].game_cnt++;
                                        }

                                        if(userStatistics[team].teamName) {
                                            _async_cb();
                                        } else {
                                            db.team.find({
                                                'id': team
                                            }, {
                                                'name': 1
                                            }).limit(1).exec(function(teamErr, teamData) {
                                                if(teamData && teamData.length) {
                                                    teamData = teamData[0];

                                                    userStatistics[team].teamName = teamData.name;
                                                    _async_cb();
                                                }
                                            });
                                        }
                                    }, function(_async_err) {
                                        async_cb();
                                    });
                                }, function(async_err) {
                                    if(async_err) {
                                        callback(null);
                                    } else {
                                        for(var key in userStatistics) {
                                            userStatistics[key].rate = ((userStatistics[key].hit/userStatistics[key].game_cnt)*100).toFixed(2);
                                        }
                                        callback(userStatistics);
                                    }
                                });
                            }
                        } else {
                            callback(null);
                        }
                    }
                });
            } else {
                callback(null);
            }
        }
    });
};

exports.getMatchesRecord = function(data, callback) {
    var nick = data.nick;

    var matchDataArray = [];

    db.user.find({
        $or: [{
            'nickname': nick
        }, {
            'email': nick
        }]
    }, {
        'email': 1
    }).limit(1).exec(function(userErr, userData) {
        if(userErr) {
            callback(null);
        } else {
            if(userData && userData.length) {
                userData = userData[0];

                var email = userData.email;

                db.prediction.find({
                    'userEmail': email,
                    'confirmed': true,
                    'result': {
                        $in: ['true', 'false']
                    }
                }).exec(function(predictErr, predictData) {
                    if(predictErr) {
                        callback(null);
                    } else {
                        if(predictData && predictData.length) {
                            async.each(predictData, function(predict, async_cb) {
                                db.match.find({
                                    'id': predict.matchId
                                }).limit(1).exec(function(matchErr, matchData) {
                                    if(matchData && matchData.length) {
                                        matchData = matchData[0];

                                        if(matchData.status == 'FINISHED' && matchData.result) {
                                            db.team.find({
                                                'id': matchData.homeTeamId,
                                                'leagueId': matchData.leagueId
                                            }, {
                                                'crestUrl': 1
                                            }).limit(1).exec(function(homeErr, homeTeam) {
                                                db.team.find({
                                                    'id': matchData.awayTeamId,
                                                    'leagueId': matchData.leagueId
                                                }, {
                                                    'crestUrl': 1
                                                }).limit(1).exec(function(awayErr, awayTeam) {
                                                    matchDataArray.push({
                                                        'homeTeamName': matchData.homeTeamName || '-',
                                                        'homeTeamImg': (homeTeam && homeTeam.length ? homeTeam[0].crestUrl : ''),
                                                        'homeTeamGoals': matchData.result.goalsHomeTeam || 0,
                                                        'awayTeamName': matchData.awayTeamName || '-',
                                                        'awayTeamImg': (awayTeam && awayTeam.length ? awayTeam[0].crestUrl : ''),
                                                        'awayTeamGoals': matchData.result.goalsAwayTeam || 0,
                                                        'afterRating': predict.afterRating,
                                                        'beforeRating': predict.beforeRating,
                                                        'myPredict': predict.result,
                                                        'date': predict.ratingCalculatedTime || predict.confirmedTime,
                                                        'ratingCalculatedTime': predict.ratingCalculatedTime
                                                    });

                                                    async_cb();
                                                });
                                            });
                                        } else {
                                            async_cb();
                                        }
                                    } else {
                                        async_cb();
                                    }
                                });
                            }, function(async_err) {
                                if(async_err) {
                                    callback(null);
                                } else {
                                    callback(matchDataArray);
                                }
                            });
                        } else {
                            callback(null);
                        }
                    }
                });
            } else {
                callback(null);
            }
        }
    });
};

exports.getChartRates = function(params, callback) {
    var nick = params.search_id;
    var dateList = params.date;
    var rateList = [];

    db.user.find({
        'nickname': nick
    }, {
        'email': 1,
        'rating': 1
    }).limit(1).exec(function(userErr, userData) {
        if(userData && userData.length) {
            userData = userData[0];

            async.mapSeries(dateList, function(list, async_cb) {
            var targetStartDate = new Date(list.year + '-' + list.month + '-' + list.day + ' 00:00:00');
            var targetFinDate = new Date(list.year + '-' + list.month + '-' + list.day + ' 23:59:59');
            db.prediction.find({
                $and: [
                    {
                        'userEmail': userData.email,
                        'confirmed': true,
                        'result': {
                            $in: ['true', 'false']
                        }
                    },
                    {
                        'ratingCalculatedTime': {
                            $gte: targetStartDate
                        }
                    },
                    {
                        'ratingCalculatedTime': {
                            $lte: targetFinDate
                        }
                    }
                ]
            }).sort({'ratingCalculatedTime': -1}).limit(1).lean().exec(function(err, data) {
                if(data && data.length) {
                    data = data[0];
                    data.afterRating = parseInt(data.afterRating, 10);
                    rateList.push(data.afterRating);
                    async_cb();
                } else {
                    db.prediction.find({
                        $and: [
                            {
                                'userEmail': userData.email,
                                'confirmed': true,
                                'result': {
                                    $in: ['true', 'false']
                                }
                            },
                            {
                                'ratingCalculatedTime': {
                                    $lte: targetStartDate
                                }
                            }
                        ]
                    }).sort({'ratingCalculatedTime': -1}).limit(1).lean().exec(function(_err, _data) {
                        if(_data && _data.length) {
                            _data = _data[0];
                            _data.afterRating = parseInt(_data.afterRating, 10);
                            rateList.push(_data.afterRating);
                        } else {
                            rateList.push(1500);
                        }
                        async_cb();
                    });
                }
            });
        }, function(async_err) {
            callback(rateList);
        });
        } else {
            callback(false);
        }
    });
};

exports.getRecentPredict = function(options, callback) {
    var email = options.email;
    var recentPredictData = [];

    db.prediction.find({
        'userEmail': email,
        'result': {
            $in: ['true', 'false']
        }
    }).sort({'ratingCalculatedTime': -1}).limit(4).exec(function(err, data) {
        if(data && data.length) {
            async.mapSeries(data, function(predict, async_cb) {
                db.match.find({
                    'id': predict.matchId
                }, {
                    'homeTeamId': 1,
                    'awayTeamId': 1,
                    'homeTeamName': 1,
                    'awayTeamName': 1,
                    'result': 1,
                    'leagueId': 1
                }).limit(1).exec(function(_err, matchData) {
                    if(matchData && matchData.length) {
                        matchData = matchData[0];

                        db.team.find({
                            'id': matchData.homeTeamId
                        }, {
                            'crestUrl': 1,
                            'shortName': 1
                        }).limit(1).exec(function(homeErr, homeData) {
                            db.team.find({
                                'id': matchData.awayTeamId,
                                'leagueId': matchData.leagueId
                            }, {
                                'crestUrl': 1,
                                'shortName': 1
                            }).limit(1).exec(function(awayErr, awayData) {
                                recentPredictData.push({
                                    'homeTeamName': homeData[0].shortName,
                                    'awayTeamName': awayData[0].shortName,
                                    'homeTeamImg': (homeData && homeData.length ? homeData[0].crestUrl : ''),
                                    'awayTeamImg': (awayData && awayData.length ? awayData[0].crestUrl : ''),
                                    'homeTeamGoals': (matchData.result && !isNaN(matchData.result.goalsHomeTeam) ? matchData.result.goalsHomeTeam : '-'),
                                    'awayTeamGoals': (matchData.result && !isNaN(matchData.result.goalsAwayTeam) ? matchData.result.goalsAwayTeam : '-'),
                                    'date': predict.ratingCalculatedTime || predict.createTime,
                                    'predictResult': predict.result
                                });
                                async_cb();
                            });
                        });
                    } else {
                        async_cb();
                    }
                });
            }, function(async_err) {
                callback(recentPredictData);
            });
        } else {
            callback(null);
        }
    });
};

exports.getMatchPrediction = function(params, callback) {
    db.prediction.find({
        'userEmail': params.email,
        'matchId': params.matchId
    })
    .limit(1)
    .exec(function(err, data) {
        if (data.length) {
            data = data[0];
        } else {
            data = null;
        }

        callback(data);
    });
};

exports.deleteExpiredBasket = function(params, callback) {
    var query = {
        'matchId': params.matchId,
        'confirmed': false
    };

    if (params.userEmail) {
        query.userEmail = params.userEmail;
    }
    db.prediction.remove(query, function(err) {
        callback();
    });
};

exports.getUserList = function(options, callback) {
    var matchId = options.matchId;
    var email = options.email;
    var sportsId = options.sportsId;

    db.prediction.find({
        'matchId': matchId,
        'sportsId': sportsId,
        'confirmed': true
    }, {
        'userEmail': 1
    }, function(predictionErr, predictionData) {
        if(predictionData && predictionData.length) {
            var predictList = [];
            async.each(predictionData, function(eachPredict, async_cb) {
                if(eachPredict.userEmail !== email) {
                    predictList.push(eachPredict.userEmail);
                }
                async_cb();
            }, function(async_err) {
                db.user.find({
                    'email': {
                        $in: predictList
                    },
                    'readyGameCnt': {
                        $lt: 1
                    }
                }, {
                    'email': 1,
                    'nickname': 1,
                    'rating': 1,
                    'readyGameCnt': 1
                }).sort({'rating': -1}).exec(function(userErr, userData) {
                    if(userData && userData.length) {
                        callback(userData);
                    } else {
                        callback(null);
                    }
                });
            });
        } else {
            callback(null);
        }
    });
};

exports.getViewList = function(options, callback) {
    var matchId = options.matchId;
    var userEmail = options.userEmail;
    var sportsId = options.sportsId;

    db.prediction.find({
        'matchId': matchId,
        'sportsId': sportsId,
        'userEmail': userEmail
    }, {
        'viewList': 1
    }).limit(1).exec(function(err, data) {
        if(data && data.length) {
            data = data[0];
            if(data.viewList && data.viewList.length) {
                callback(data.viewList);
            } else {
                callback([]);
            }
        } else {
            callback([]);
        }
    });
};

exports.pushViewList = function(options, callback) {
    var target = options.target;
    var myEmail = options.myEmail;
    var matchId = options.matchId;

    db.prediction.find({
        'userEmail': target,
        'matchId': matchId
    }, {
        'viewList': 1
    }).limit(1).exec(function(err, data) {
        if(data && data.length) {
            data = data[0];

            if(data.viewList.indexOf(myEmail) > -1) {
                callback(false);
            } else {
                db.prediction.update({
                    'userEmail': target,
                    'matchId': matchId
                }, {
                    $addToSet: {
                        'viewList': myEmail
                    }
                }, function(updateErr) {
                    if(updateErr) {
                        callback(false);
                    } else {
                        callback(true);
                    }
                });
            }
        } else {
            callback(false);
        }
    });
};

exports.getPick = function(options, callback) {
    var matchId = options.matchId;
    var userEmail = options.userEmail;

    db.prediction.find({
        'matchId': matchId,
        'userEmail': userEmail
    }, {
        'pick': 1
    }).limit(1).exec(function(err, data) {
        if(data && data.length) {
            data = data[0];
            callback(data.pick);
        } else {
            callback(null);
        }
    });
};

exports.getPredictSummary = function(params, callback) {
    db.prediction.find({
        'userEmail': params.email
    }).exec(function(err, predictionData) {
        var hit = 0;
        var fail = 0;
        for (var i = 0; i < predictionData.length; i++) {
            if (predictionData[0].result == 'true') {
                hit++;
            } else if (predictionData[0].result == 'false') {
                fail++;
            }
        }

        callback({
            'hit': hit,
            'fail': fail
        })
    });
};

exports.getProceedingPredict = function(options, callback) {
    var searchId = options.searchId;
    var proceedingMatches = [];

    db.user.find({
        'nickname': searchId
    }, {
        'email': 1
    }).limit(1).exec(function(err, userData) {
        if(userData && userData.length) {
            email = userData[0].email;

            db.prediction.find({
                'userEmail': email,
                'confirmed': true,
                'result': 'wait'
            }, {
                'matchId': 1
            }).limit(5).sort({confirmedTime:-1}).exec(function(_err, proceeding) {
                async.mapSeries(proceeding, function(each, async_cb) {
                    db.match.find({
                        'id': each.matchId
                    }, {
                        'date': 1,
                        'homeTeamId': 1,
                        'awayTeamId': 1
                    }).limit(1).exec(function(__err, proceedingMatch) {
                        if(proceedingMatch && proceedingMatch.length) {
                            proceedingMatch = proceedingMatch[0];
                            db.team.find({
                                'id': proceedingMatch.homeTeamId
                            }, {
                                'crestUrl': 1,
                                'shortName': 1
                            }).limit(1).exec(function(homeErr, homeData) {
                                db.team.find({
                                    'id': proceedingMatch.awayTeamId
                                }, {
                                    'crestUrl': 1,
                                    'shortName': 1
                                }).limit(1).exec(function(awayErr, awayData) {
                                    proceedingMatches.push({
                                        'matchId': each.matchId,
                                        'date': new Date(proceedingMatch.date),
                                        'homeTeamName': homeData[0].shortName,
                                        'awayTeamName': awayData[0].shortName,
                                        'homeTeamImg': homeData[0].crestUrl,
                                        'awayTeamImg': awayData[0].crestUrl
                                    });
                                    async_cb();
                                });
                            });
                        } else {
                            async_cb();
                        }
                    });
                }, function(async_err) {
                    callback(proceedingMatches);
                });
            });
        } else {
            callback(null);
        }
    });
};

exports.getThisMatchPredictionCount = function(params, callback) {
    db.prediction.find({
        'matchId': params.matchId,
        'confirmed': true
    }).exec(function(err, data) {
        callback(data.length);
    });
};
