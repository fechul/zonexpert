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

exports.get
