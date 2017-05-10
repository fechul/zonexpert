var async = require('async');

exports.add = function(data, callback) {
    db.match.find({
        'id': data.matchId
    })
    .limit(1)
    .exec(function(err, matchData) {
        if (matchData.length) {
            matchData = matchData[0];

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
                        'teamList': [matchData.homeTeamId, matchData.awayTeamId],
                        'confirmed': false
                    });

                    newPrediction.save(function(save_err) {
                        callback(save_err ? false : true);
                    });
                } else {
                    callback(false);
                }
            });
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
        callback(err ? false : true);
    });
};

exports.confirm = function(data, callback) {
    var userEmail = data.userEmail;
    var beforeRating = data.beforeRating;

    async.each(data.predictions, function(prediction, async_callback) {
        db.match.find({
            'id': prediction.matchId
        })
        .limit(1)
        .exec(function(err, matchData) {
            if (matchData.length == 1) {
                matchData = matchData[0];

                db.prediction.find({
                    'userEmail': userEmail,
                    'matchId': matchData.id,
                }, function(_err, predictionData) {
                    if (predictionData.length == 1) {
                        db.prediction.update({
                            'userEmail': userEmail,
                            'matchId': matchData.id
                        }, {
                            '$set': {
                                'confirmed': true,
                                'pick': prediction.pick,
                                'result': 'wait',
                                'beforeRating': beforeRating
                            }
                        }).exec(function(err) {
                            async_callback();
                        });
                    } else {
                        async_callback();
                    }
                });
            } else {
                async_callback();
            }
        });
    }, function(err, result) {
        callback(true);
    });
};

exports.get = function(data, callback) {
    var findJson = {
        'userEmail': data.userEmail
    };

    if (data.leagueId) {
        findJson.leagueId = data.leagueId;
    }

    db.prediction.find(findJson, {
        'matchId': 1,
        'confirmed': 1
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
        'confirmed': 1
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
                    'userEmail': email
                }, function(predictErr, predictData) {
                    if(predictErr) {
                        callback(null);
                    } else {
                        if(predictData && predictData.length) {
                            if(type == 'league') {
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
                }, function(predictErr, predictData) {
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
                                                        'homeTeamGoals': matchData.result.homeTeam.goalsHomeTeam || 0,
                                                        'awayTeamName': matchData.awayTeamName || '-',
                                                        'awayTeamImg': (awayTeam && awayTeam.length ? awayTeam[0].crestUrl : ''),
                                                        'awayTeamGoals': matchData.result.awayTeam.goalsAwayTeam || 0,
                                                        'afterRating': matchData.afterRating,
                                                        'beforeRating': matchData.beforeRating,
                                                        'myPredict': predictData.result,
                                                        'date': new Date()  // date has to be updated
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
