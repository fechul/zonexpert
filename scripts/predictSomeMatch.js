var mongoose = require('mongoose');
var async = require('async');
var md5 = require('md5');

var users = require('../core/user.js');

var mongoose_db = mongoose.connection;
mongoose_db.on('error', console.error);
mongoose_db.once('open', function() {
    console.log("Connected to mongd server");
});

mongoose.connect('mongodb://localhost');

global.db = require('../db/schema.js');

var matchIdList = [
    '158901',
    '158902',
    '154508',
    '154509',
    '154510',
    '154511',
    '154512',
    '154513',
    '154514',
    '154515',
    '154516',
    '154517'
];

db.user.find({
    'email': /test/g
}).exec(function(err, users) {
    async.each(matchIdList, function(matchId, a_cb) {
        db.match.find({
            'id': matchId
        })
        .limit(1)
        .exec(function(_err, matchData) {
            matchData = matchData[0];
            async.each(users, function(user, _a_cb) {
                console.log(matchId, user.email);
                var pickRandNum = Math.floor((Math.random() * 3)) + 1;
                var pick = '';
                if (pickRandNum == 1) {
                    pick = 'home';
                } else if (pickRandNum == 2) {
                    pick = 'draw';
                } else if (pickRandNum == 3) {
                    pick = 'away';
                }
                var newPrediction = new db.prediction({
                    'userEmail': user.email,
                    'createTime': new Date(matchData.date),
                    'matchId': matchData.id,
                    'leagueId': matchData.leagueId,
                    'teamList': [matchData.homeTeamId, matchData.awayTeamId],
                    'confirmed': true,
                    'confirmedTime': new Date(matchData.date),
                    'pick': pick,
                    'result': 'wait'
                });
                newPrediction.save(function() {
                    _a_cb();
                });
            }, function() {
                a_cb();
            });
        });
    }, function() {
        console.log('predict complete');
    });
});
