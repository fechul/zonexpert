var mongoose = require('mongoose');
var async = require('async');
var nodeSchedule = require('node-schedule');

var mongoose_db = mongoose.connection;
mongoose_db.on('error', console.error);
mongoose_db.once('open', function() {
    console.log("Connected to mongd server");
});

mongoose.connect('mongodb://localhost');

db = require('./db/schema.js');

var newMatchDataList = [];
var currentTime = (new Date()).getTime();

for (var i = 0; i < 40; i++) {
    newMatchDataList.push({
        'id': '99999' + i,
        'leagueId': '999',
        'date': new Date(currentTime + i * 1000 * 30),
        'matchday': 1,
        'homeTeamName': 'homeTeamName' + i,
        'homeTeamId': 'homeTeamId' + i,
        'awayTeamName': 'awayTeamName' + i,
        'awayTeamId': 'awayTeamId' + i,
        'status': 'TIMED',
        'roomOpen': false
    });
}

db.match.remove({
    'leagueId': '999'
}).exec(function() {
    db.prediction.remove({
        'leagueId': '999'
    }).exec(function() {
        async.each(newMatchDataList, function(newMatchData, a_c) {
            var newMatch = new db.match(newMatchData);
            newMatch.save(function() {
                a_c();
            });
        }, function() {
            console.log('add new matches complete...');
        });
    });
});
