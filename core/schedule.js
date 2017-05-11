var async = require('async');


exports.initialize = function(data, callback) {
    async.eachSeries(data.schedules, function(schedule, async_cb) {
        var newMatchJson = {
            'leagueId' : schedule._links.competition.href.split('/').pop(),
            'id' : schedule._links.self.href.split('/').pop(),
            'date' : new Date(schedule.date),
            'matchday' : schedule.matchday,
            'homeTeamName' : schedule.homeTeamName,
            'homeTeamId' : schedule._links.homeTeam.href.split('/').pop(),
            'awayTeamName' : schedule.awayTeamName,
            'awayTeamId' : schedule._links.awayTeam.href.split('/').pop(),
            'status': schedule.status
        };


        if (schedule.result) {
            newMatchJson.result = schedule.result;
        }

        var newMatch = new db.match(newMatchJson);

        newMatch.save(function(err) {
            async_cb();
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

            var newTeam = new db.team(newTeamJson);
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
