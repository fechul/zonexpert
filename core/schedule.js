var async = require('async');

var rating = require('./rating.js');
var prediction = require('./prediction.js');
var chat = require('./chat.js');

exports.updateMatches = function(data, callback) {
    var sportsId = data.sportsId;
    async.eachSeries(data.matches, function(match, async_cb) {
        var matchId = match._links ? match._links.self.href.split('/').pop() : match.id;

        if (matchId) {
            db.match.find({
                'id': matchId
            })
            .limit(1)
            .exec(function(err, matchData) {
                if (matchData.length) {
                    matchData = matchData[0];

                    var currentStatus = matchData.status;
                    var newStatus = match.status;

                    var currentTime = new Date(matchData.date).getTime();
                    var newTime = new Date(match.date).getTime();

                    db.match.update({
                        'id': matchData.id
                    }, {
                        '$set': {
                            'sportsId': sportsId,
                            'date': new Date(match.date),
                            'status': match.status,
                            'result': match.result
                        }
                    }).exec(function(_err) {
                        if (newStatus == 'IN_PLAY') {
                            chat.sendMsgToRoom(matchData.id, {
                                'status': 'IN_PLAY',
                                'result': match.result
                            });
                            if (currentStatus == 'TIMED') {
                                prediction.deleteExpiredBasket({
                                    'matchId': matchData.id
                                }, function() {
                                    async_cb();
                                });
                            } else {
                                async_cb();
                            }
                            // 경기 시작 - 예측 못하게 막기 (알아서 막아짐), 장바구니에 있는거 뺴기
                        } else if ((currentStatus == 'IN_PLAY') && (newStatus == 'FINISHED')) {
                            chat.sendMsgToRoom(matchData.id, {
                                'status': 'FINISHED',
                                'result': match.result
                            });
                            // 경기 종료 - 레이팅 계산하기,
                            rating.addQueue({
                                'matchId': matchData.id
                            }, function(result) {
                                async_cb();
                            });
                        } else if((currentStatus != 'POSTPONED_RAIN') && (newStatus == 'POSTPONED_RAIN')) {
                            chat.sendMsgToRoom(matchData.id, {
                                'status': 'POSTPONED_RAIN',
                                'result': match.result
                            });
                            
                            rating.addQueue({
                                'matchId': matchData.id
                            }, function(result) {
                                async_cb();
                            });
                        } else if((currentStatus != 'POSTPONED') && (newStatus == 'POSTPONED')) {
                            chat.sendMsgToRoom(matchData.id, {
                                'status': 'POSTPONED',
                                'result': match.result
                            });
                            
                            rating.addQueue({
                                'matchId': matchData.id
                            }, function(result) {
                                async_cb();
                            });
                        } else {
                            async_cb();
                        }
                    });
                } else {
                    var newMatchJson = {
                        'id' : matchId,
                        'leagueId' : match._links ? match._links.competition.href.split('/').pop() : match.leagueId,
                        'sportsId': sportsId,
                        'date' : new Date(match.date),
                        'matchday' : match.matchday,
                        'homeTeamName' : match.homeTeamName,
                        'homeTeamId' : match.homeTeamId || match._links.homeTeam.href.split('/').pop(),
                        'awayTeamName' : match.awayTeamName,
                        'awayTeamId' : match.awayTeamId || match._links.awayTeam.href.split('/').pop(),
                        'status': match.status,
                        'result': match.result || {
                            'goalsHomeTeam': 0,
                            'goalsAwayTeam': 0
                        }
                    };

                    var newMatch = new db.match(newMatchJson);

                    newMatch.save(function(err) {
                        async_cb();
                    });
                }
            });
        } else {
            db.match.find({
                'sportsId': sportsId,
                'homeTeamId': match.homeTeamId,
                'awayTeamId': match.awayTeamId,
                'date': new Date(match.date)
            })
            .limit(1)
            .exec(function(err, matchData) {
                if (matchData.length) {
                    matchData = matchData[0];

                    var currentStatus = matchData.status;
                    var newStatus = match.status;

                    var currentTime = new Date(matchData.date).getTime();
                    var newTime = new Date(match.date).getTime();

                    db.match.update({
                        'id': matchData.id
                    }, {
                        '$set': {
                            'sportsId': sportsId,
                            'date': new Date(match.date),
                            'status': match.status,
                            'result': match.result
                        }
                    }).exec(function(_err) {
                        if (newStatus == 'IN_PLAY') {
                            // 경기 시작 - 예측 못하게 막기 (알아서 막아짐), 장바구니에 있는거 뺴기
                            chat.sendMsgToRoom(matchData.id, {
                                'status': 'IN_PLAY',
                                'result': match.result
                            });

                            if (currentStatus == 'TIMED') {
                                prediction.deleteExpiredBasket({
                                    'matchId': matchData.id
                                }, function() {
                                    async_cb();
                                });
                            } else {
                                async_cb();
                            }
                        } else if ((currentStatus == 'IN_PLAY') && (newStatus == 'FINISHED')) {
                            // 경기 종료 - 레이팅 계산하기
                            chat.sendMsgToRoom(matchData.id, {
                                'status': 'FINISHED',
                                'result': match.result
                            });

                            rating.addQueue({
                                'matchId': matchData.id
                            }, function(result) {
                                async_cb();
                            });
                        } else if((currentStatus != 'POSTPONED_RAIN') && (newStatus == 'POSTPONED_RAIN')) {
                            chat.sendMsgToRoom(matchData.id, {
                                'status': 'POSTPONED_RAIN',
                                'result': match.result
                            });
                            
                            rating.addQueue({
                                'matchId': matchData.id
                            }, function(result) {
                                async_cb();
                            });
                        } else if((currentStatus != 'POSTPONED') && (newStatus == 'POSTPONED')) {
                            chat.sendMsgToRoom(matchData.id, {
                                'status': 'POSTPONED',
                                'result': match.result
                            });
                            
                            rating.addQueue({
                                'matchId': matchData.id
                            }, function(result) {
                                async_cb();
                            });
                        } else {
                            async_cb();
                        }
                    });
                } else {
                    var newMatchJson = {
                        'id' : matchId,
                        'leagueId' : match._links ? match._links.competition.href.split('/').pop() : match.leagueId,
                        'sportsId': sportsId,
                        'date' : new Date(match.date),
                        'matchday' : match.matchday,
                        'homeTeamName' : match.homeTeamName,
                        'homeTeamId' : match.homeTeamId || match._links.homeTeam.href.split('/').pop(),
                        'awayTeamName' : match.awayTeamName,
                        'awayTeamId' : match.awayTeamId || match._links.awayTeam.href.split('/').pop(),
                        'status': match.status,
                        'result': match.result || {
                            'goalsHomeTeam': 0,
                            'goalsAwayTeam': 0
                        }
                    };

                    db.match.find({
                        'leagueId': match.leagueId
                    })
                    .sort({'_id': -1})
                    .limit(1)
                    .exec(function(___err, lastMatch) {
                        if (lastMatch.length) {
                            newMatchJson.id = match.leagueId + (parseInt(lastMatch[0].id.substring(match.leagueId.length), 10) + 1);
                        } else {
                            newMatchJson.id = match.leagueId + 1;
                        }

                        var newMatch = new db.match(newMatchJson);

                        newMatch.save(function(err) {
                            async_cb();
                        });
                    });
                }
            });
        }
    }, function(async_err) {
        callback(true);
    });
};

exports.team_initialize = function(data, callback) {
    for(var key in data) {
        for(var i = 0; i < data[key].teams.length; i++) {
            var id = data[key].teams[i]._links.self.href.split('/').pop();
            var newTeamJson = {
                'id' : id,
                'leagueId': key.toString(),
                'name': data[key].teams[i].name,
                'code': data[key].teams[i].code,
                'shortName': data[key].teams[i].shortName,
                'squadMarketValue': data[key].teams[i].squadMarketValue,
                'crestUrl': data[key].teams[i].crestUrl
            };


            // db.team.find({
            //     'id': id,
            //     'leagueId': key.toString()
            // }).limit(1).exec(function(teamData) {
            //     if(teamData && teamData.length) {
            //
            //     } else {
                    var newTeam = new db.team(newTeamJson);
            //     }
            // });


            newTeam.save(function(err) {

            });
            // db.team.find({
            //     'id': id,
            //     'leagueId': key.toString()
            // }).limit(1).exec(function(teamData) {
            //     if(teamData && teamData.length) {
            //
            //     } else {
            //         var newTeam = new db.team(newTeamJson);
            //         newTeam.save(function(err) {
            //
            //         });
            //     }
            // });
        }
    }

    callback(true);
};

exports.getLeagueMatches = function(data, callback) {
    db.match.find({
        'leagueId': data.leagueId
    })
    .sort('date')
    .exec(function(err, matches) {
        callback(matches);
    });
};

exports.getMatch = function(params, callback) {
    var matchId = params.matchId;
    db.match.find({
        'id': matchId
    })
    .limit(1)
    .exec(function(err, data) {
        if (data && data.length) {
            callback(data[0]);
        } else {
            callback(null);
        }
    });
};

exports.getMatches = function(data, callback) {
    db.match.find({
        'id': {
            '$in': data.idList
        }
    })
    .sort('date')
    .exec(function(err, matches) {
        callback(matches || []);
    });
};

exports.setLiveMatch = function(callback) {
    var currentTime = new Date();
    var tempMatchList = {
        'count': 0,
        'TIMED': [],
        'IN_PLAY': [],
        'FINISHED': []
    };

    db.match.find({
        '$or': [
            {
                'status': 'IN_PLAY'
            },
            {
                '$and': [
                    {
                        'status': 'TIMED'
                    },{
                        'date': {
                            '$gte': currentTime
                        }
                    }, {
                        'date': {
                            '$lte': new Date(currentTime.getTime() + 1000 * 60 * 10)
                        }
                    }
                ]
            },
            {
                '$and': [
                    {
                        'status': 'FINISHED'
                    },{
                        'date': {
                            '$gte': new Date(currentTime.getTime() - 1000 * 60 * 10)
                        }
                    }, {
                        'date': {
                            '$lte': currentTime
                        }
                    }
                ]
            }
        ]
    }).exec(function(err, matches) {
        if (matches.length) {
            for (var i = 0; i < matches.length; i++) {
                if (matches[i].status != 'FINISHED') {
                    tempMatchList.count++;
                }

                if (tempMatchList[matches[i].status]) {
                    tempMatchList[matches[i].status].push(matches[i].id);
                }
            }
        }

        __matchList = tempMatchList;

        if (callback && (typeof(callback) == 'function')) {
            callback(true);
        }
    });
};

exports.getMatchTeamsName = function(data, callback) {
    var homeTeamName = '';
    var awayTeamName = '';
    var homeTeamImg = '';
    var awayTeamImg = '';

    db.match.find({
        'id': data.matchId
    }, {
        'homeTeamName': 1,
        'awayTeamName': 1,
        'homeTeamId': 1,
        'awayTeamId': 1,
        'leagueId': 1
    }).limit(1).exec(function(err, data) {
        if(err) {
            console.log('schedule getMatchTeamsName Err: ', err);
        } else {
            if(data && data.length) {
                data = data[0];
                homeTeamName = data.homeTeamName;
                awayTeamName = data.awayTeamName;

                db.team.find({
                    'id': data.homeTeamId,
                    'leagueId': data.leagueId
                }, {
                    'crestUrl': 1
                }).limit(1).exec(function(homeErr, homeData) {
                    db.team.find({
                        'id': data.awayTeamId,
                        'leagueId': data.leagueId
                    }, {
                        'crestUrl': 1
                    }).limit(1).exec(function(awayErr, awayData) {
                        if(homeData && homeData.length) {
                            homeTeamImg = homeData[0].crestUrl;
                        }

                        if(awayData && awayData.length) {
                            awayTeamImg = awayData[0].crestUrl;
                        }

                        callback({
                            'homeTeamName': homeTeamName,
                            'awayTeamName': awayTeamName,
                            'homeTeamImg': homeTeamImg,
                            'awayTeamImg': awayTeamImg
                        });
                    });
                });
            }
        }
    });
};

exports.getScheduledMatches = function(callback) {
    var scheduled = [];

    db.match.find({
        'status': 'SCHEDULED'
    }, {
        'date': 1,
        'homeTeamId': 1,
        'awayTeamId': 1,
        'id': 1
    }).sort({date:1}).limit(3).exec(function(err, data) {
        if(data && data.length) {
            async.mapSeries(data, function(match, async_cb) {
                db.team.find({
                    'id': match.homeTeamId
                }, {
                    'shortName': 1,
                    'crestUrl': 1
                }).limit(1).exec(function(homeErr, homeData) {
                    db.team.find({
                        'id': match.awayTeamId
                    }, {
                        'shortName': 1,
                        'crestUrl': 1
                    }).limit(1).exec(function(awayErr, awayData) {
                        scheduled.push({
                            date: match.date,
                            homeTeamName: (homeData && homeData.length ? homeData[0].shortName : '-'),
                            awayTeamName: (awayData && awayData.length ? awayData[0].shortName : '-'),
                            homeTeamImg: (homeData && homeData.length ? homeData[0].crestUrl : '-'),
                            awayTeamImg: (awayData && awayData.length ? awayData[0].crestUrl : '-'),
                            matchId: match.id
                        });
                        async_cb();
                    });
                });
            }, function(async_err) {
                callback(scheduled);
            });
        } else {
            callback([]);
        }
    });
};

exports.pushViewListToMatch = function(options, callback) {
    var myEmail = options.myEmail;
    var matchId = options.matchId;

    db.match.find({
        'id': matchId
    }, {
        'systemViewList': 1
    }).limit(1).exec(function(err, data) {
        if(data && data.length) {
            data = data[0];

            if(data.systemViewList.indexOf(myEmail) > -1) {
                callback(false);
            } else {
                db.match.update({
                    'id': matchId
                }, {
                    $addToSet: {
                        'systemViewList': myEmail
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
