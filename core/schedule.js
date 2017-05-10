var async = require('async');

exports.updateMatches = function(data, callback) {
    async.eachSeries(data.matches, function(match, async_cb) {
        db.match.find({
            'id': match._links.self.href.split('/').pop()
        })
        .limit(1)
        .exec(function(err, matchData) {
            if (matchData.length) {
                matchData = matchData[0];

                var currentStatus = matchData.status;
                var newStatus = match.status;

                var currentTime = new Date(matchData.date).getTime();
                var newTime = new Date(match.date).getTime();

                if ((currentStatus == newStatus) && (currentTime == newTime)) {
                    async_cb();
                } else {
                    db.match.update({
                        'id': match._links.self.href.split('/').pop()
                    }, {
                        '$set': {
                            'date': new Date(match.date),
                            'status': match.status
                        }
                    }).exec(function(_err) {
                        if ((currentStatus == 'TIMED') && (newStatus == 'IN_PLAY')) {
                            schedule.deleteExpiredBasket(function() {
                                async_callback();
                            });
                            // 경기 시작 - 예측 못하게 막기 (알아서 막아짐), 장바구니에 있는거 뺴기, 채팅 서버 열기
                        } else if ((currentStatus == 'IN_PLAY') && (newStatus == 'FINISHED')) {
                            // 경기 종료 - 레이팅 계산하기, 채팅서버 닫기

                            async_cb();
                        }
                    });
                }
            } else {
                var newMatchJson = {
                    'leagueId' : match._links.competition.href.split('/').pop(),
                    'id' : match._links.self.href.split('/').pop(),
                    'date' : new Date(match.date),
                    'matchday' : match.matchday,
                    'homeTeamName' : match.homeTeamName,
                    'homeTeamId' : match._links.homeTeam.href.split('/').pop(),
                    'awayTeamName' : match.awayTeamName,
                    'awayTeamId' : match._links.awayTeam.href.split('/').pop(),
                    'status': match.status
                };

                if (match.result) {
                    newMatchJson.result = match.result;
                }

                var newMatch = new db.match(newMatchJson);

                newMatch.save(function(err) {
                    async_cb();
                });
            }
        });
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

            db.team.find({
                'id': id,
                'leagueId': key.toString()
            }).limit(1).exec(function(teamData) {
                if(teamData && teamData.length) {

                } else {
                    var newTeam = new db.team(newTeamJson);
                }
            });

            newTeam.save(function(err) {

            });
        }
    }

    callback(true);
};

exports.getLeagueMatches = function(data, callback) {
    db.match.find({
        'leagueId': data.leagueId
    }).exec(function(err, matches) {
        callback(matches);
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

exports.setComingUpMatch = function(callback) {
    var currentTime = new Date();
    var tempMatchList = {
        'count': 0,
        'TIMED': [],
        'IN_PLAY': []
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
            for (var i in matches) {
                if (matches[i].status != 'FINISHED') {
                    tempMatchList.count++;
                }

                tempMatchList[matches[i].status].push(matches[i].id);
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
