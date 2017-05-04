var async = require('async');

exports.add = function(data, callback) {
    var user_email = data.user_email;
    var before_rating = data.before_rating;

    async.each(data.predictions, function(prediction, async_callback) {
        db.fixture.find({
            'id': prediction.match_id
        })
        .limit(1)
        .exec(function(err, fixture_data) {
            if (fixture_data.length) {
                var new_prediction = new db.prediction({
                    'user_email': user_email,
                    'create_time': new Date(),
                    'match_id': prediction.match_id,
                    'league_id': prediction.league_id,
                    'pick': prediction.pick,
                    'result': prediction.result,
                    'before_rating': before_rating
                });

                new_prediction.save(function (err) {
                    async_callback();
                });
            } else {
                async_callback();
            }
        });
    }, function(err, result) {
        callback(true);
    });
};

exports.get = function(user_email, callback) {
    db.prediction.find({
        'email': user_email
    }).exec(function(err, data) {
        callback(data);
    });
};
