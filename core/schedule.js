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

exports.getMatchTeamsName = function(data, callback) {
    var query = db.match.findOne({'id' : data.matchId});
    query.select('homeTeamName');
    query.select('awayTeamName');

    query.exec(function (err, data) {
        if (err) {
            console.log('err',err);
        } else {
            console.log(data);
            // json.homeTeamName = data;
        }

        callback({
            'homeTeamName': data.homeTeamName,
            'awayTeamName': data.awayTeamName
        });
    });
};
