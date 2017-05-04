var async = require('async');

exports.add = function(data, callback) {
    db.match.find({
        'id': data.matchId,
        'leagueId': data.leagueId
    })
    .limit(1)
    .exec(function(err, match) {
        if (match.length) {
            var newBasket = new db.basket({
                'userEmail': data.userEmail,
                'createTime': new Date(),
                'matchId': data.matchId,
                'leagueId': data.leagueId,
                'pick': data.pick
            });

            newBasket.save(function(save_err) {
                callback(save_err ? false : true);
            });
        } else {
            callback(false);
        }
    });
};

exports.del = function(data, callback) {
    db.basket.remove({
        'userEmail': data.userEmail,
        'matchId': data.matchId,
        'leagueId': data.leagueId
    }).exec(function(err) {
        callback(err ? false : true);
    });
};

exports.get = function(data, callback) {
    var findJson = {
        'userEmail': data.userEmail
    };

    if (data.leagueId) {
        findJson.leagueId = data.leagueId;
    }

    db.basket.find(findJson).exec(function(err, result) {
        var baskets = [];
        for (var i in result) {
            baskets.push(result[i].matchId);
        }

        callback(baskets);
    });
};
