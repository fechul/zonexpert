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
