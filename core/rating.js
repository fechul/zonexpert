var async = require('async');

var rating = {
    _queue: [],
    addQueue: function(params, callback) {
		if (this._queue.length == 0) {
            this._queue.push({
                'matchId': params.matchId,
                'callback': callback
            });

            this.calculate();
        } else {
            this._queue.push({
                'matchId': params.matchId,
                'callback': callback
            });
        }
    },
    calculate: function() {
        var self = this;
        var matchId = this._queue[0].matchId;
        var callback = this._queue[0].callback;
        var sportsId = '';

        var matchResult = '';
        var ratingSum = 0;
        var ratingAvg = 0;
        var userList = [];
        var pickList = {
            'home': 0,
            'draw': 0,
            'away': 0
        };
        var pickRate = {
            'home': 0,
            'draw': 0,
            'away': 0
        };

        db.match.find({
            'id': matchId
        })
        .limit(1)
        .exec(function(err, matchData) {
            matchData = matchData[0];
            sportsId = matchData.sportsId;
            if (matchData.result.goalsHomeTeam > matchData.result.goalsAwayTeam) {
                matchResult = 'home'
            } else if (matchData.result.goalsHomeTeam < matchData.result.goalsAwayTeam) {
                matchResult = 'away';
            } else {
                matchResult = 'draw';
            }

            db.prediction.find({
                'matchId':matchId,
                'confirmed': true,
                'result': 'wait'
            }).exec(function(findPredictionErr, predictions) {
                async.each(predictions, function(prediction, async_cb) {
                    pickList[prediction.pick]++;

                    var pickResult = 'false';
                    if (prediction.pick == matchResult) {
                        pickResult = 'true';
                    }

                    db.user.find({
                        'email': prediction.userEmail
                    })
                    .limit(1)
                    .exec(function(findUserErr, userData) {
                        if (userData.length) {
                            userData = userData[0];
                            ratingSum += userData.rating;
                            userList.push({
                                'email': userData.email,
                                'beforeRating': userData.rating,
                                'ratingChange': 0,
                                'afterRating': null,
                                'pick': prediction.pick,
                                'result': pickResult,
                                'readyGameCnt': userData.readyGameCnt,
                                'record': userData.record
                            });
                        }

                        async_cb();
                    });
                }, function() {
                    //before 레이팅은 계산하기 바로 직전값 계산 후에 afterRating과 같이 넣어야 한다!
                    ratingAvg = ratingSum / userList.length;
                    for (var i in pickList) {
                        pickRate[i] = pickList[i] / userList.length;
                    }

                    async.each(userList, function(user, _async_cb) {
                        var defaultIncreaseValue = user.readyGameCnt == 0 ? 30 : 45;
                        var defaultDecreaseValue = user.readyGameCnt == 0 ? -25 : -40;

                        user.readyGameCnt--;
                        if (user.readyGameCnt < 0) {
                            user.readyGameCnt = 0;
                        }

                        if (!user.record) {
                            user.record = {
                                'total': {
                                    'hit': 0,
                                    'fail': 0
                                }
                            };
                        }

                        if (!user.record[sportsId]) {
                            user.record[sportsId] = {
                                'total': {
                                    'hit': 0,
                                    'fail': 0
                                }
                            }
                        }

                        if (!user.record[sportsId][matchData.leagueId]) {
                            user.record[sportsId][matchData.leagueId] = {
                                'hit': 0,
                                'fail': 0
                            };
                        }

                        if(matchData.status == 'POSTPONED' || matchData.status == 'POSTPONED_RAIN') {
                            user.ratingChange = defaultIncreaseValue + self.getCompByPickRate(pickRate[user.pick]) + self.getCompByUserRating(user.beforeRating, ratingAvg);
                            user.result = 'true';
                            user.record.total.hit++;
                            user.record[sportsId].total.hit++;
                            user.record[sportsId][matchData.leagueId].hit++;
                        } else if (user.pick == matchResult) {
                            //픽률이 높을수록 ++, 픽률이 낮을수록 --
                            user.ratingChange = defaultIncreaseValue + self.getCompByPickRate(pickRate[user.pick]) + self.getCompByUserRating(user.beforeRating, ratingAvg);
                            user.result = 'true';
                            user.record.total.hit++;
                            user.record[sportsId].total.hit++;
                            user.record[sportsId][matchData.leagueId].hit++;
                        } else {
                            user.ratingChange = defaultDecreaseValue + self.getCompByPickRate(pickRate[user.pick]) + self.getCompByUserRating(user.beforeRating, ratingAvg)
                            user.result = 'false';
                            user.record.total.fail++;
                            user.record[sportsId].total.fail++;
                            user.record[sportsId][matchData.leagueId].fail++;
                        }

                        user.afterRating = user.beforeRating + user.ratingChange;

                        db.prediction.update({
                            'userEmail': user.email,
                            'matchId': matchId
                        }, {
                            '$set': {
                                'beforeRating': user.beforeRating,
                                'afterRating': user.afterRating,
                                'result': user.result,
                                'ratingCalculatedTime': new Date()
                            }
                        }).exec(function(err) {
                            db.user.update({
                                'email': user.email
                            }, {
                                '$set': {
                                    'rating': user.afterRating,
                                    'readyGameCnt': user.readyGameCnt,
                                    'record': user.record
                                }
                            }).exec(function(_err) {
                                var game_cnt_rank = user.record.total.hit + user.record.total.fail;
                                var predict_rate_rank = 0;
                                predict_rate_rank = user.record.total.hit / game_cnt_rank;

                                if(user.readyGameCnt <= 0) {
                                    redis_client.zadd('rating_rank', user.afterRating, user.email, function(zerr, reply) {
                                        redis_client.zadd('game_cnt_rank', game_cnt_rank, user.email, function(_zerr, _reply) {
                                            redis_client.zadd('predict_rate_rank', predict_rate_rank, user.email, function(__zerr, __reply) {
                                                _async_cb();
                                            });
                                        });
                                    });
                                } else {
                                    _async_cb();
                                }

                          //       db.prediction.find({
                          //           'userEmail': user.email,
                          //           'result': {
                          //               '$ne': 'wait'
                          //           }
                          //       }).exec(function(_findPredictionErr, _predictions) {
                          //           var game_cnt_rank = _predictions.length;
                          //           var predict_rate_rank = 0;

                          //           for (var j = 0; j < _predictions.length; j++) {
                          //               if (_predictions[j].result == 'true')
                          //               predict_rate_rank++;
                          //           }

                          //           predict_rate_rank = predict_rate_rank / game_cnt_rank;

                          //           if(user.readyGameCnt <= 0) {
                          //               redis_client.zadd('rating_rank', user.afterRating, user.email, function(zerr, reply) {
                          //                   redis_client.zadd('game_cnt_rank', game_cnt_rank, user.email, function(_zerr, _reply) {
                          //                       redis_client.zadd('predict_rate_rank', predict_rate_rank, user.email, function(__zerr, __reply) {
                          //                           _async_cb();
                          //                       });
                          //                   });
                          //               });
                          //           } else {
                          //               _async_cb();
                          //           }
                        		// });
                            });
                        });
                    }, function() {
                        if (self._queue[0].callback && (typeof(self._queue[0].callback) == 'function')) {
                            self._queue[0].callback();
                        }
                        self._queue.shift();
                        if (self._queue.length) {
                            self.calculate();
                        }
                    });
                });
            });
        })
    },
    getCompByPickRate: function(rate) {
        var p = -20 * rate + 10;

        return p;
    },
    getCompByUserRating: function(rating, ratingAvg) {
        var win_rate = 1 / (1 + Math.pow(10, (ratingAvg - rating) / ratingAvg));
        var w = -20 * win_rate + 10;

        return w;
    },
};

module.exports = rating;
