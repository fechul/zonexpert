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
                            // 경기 시작 - 예측 못하게 막기, 장바구니에 있는거 뺴기, 실시간 점수 소켓 연결 
                        } else if ((currentStatus == 'IN_PLAY') && (newStatus == 'FINISHED')) {
                            // 경기 종료 - 레이팅 계산하기, 채팅서버 닫기
                        }

                        async_cb();
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
            }
        ]
    }).exec(function(err, matches) {
        if (matches.length) {
            for (var i in matches) {
                tempMatchList.count++;
                tempMatchList[matches[i].status].push(matches[i].id);
            }
        }

        __matchList = tempMatchList;

        if (callback && (typeof(callback) == 'function')) {
            callback(true);
        }
    });
};
