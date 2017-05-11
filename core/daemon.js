var node_schedule = require('node-schedule');
var http = require('http');
var async = require('async');

var schedule = require('./schedule.js');
var chat = require('./chat.js');

var leagueIdArray = [426, 429, 430, 432, 433, 434, 436, 438, 439, 440];
// var leagueIdArray = [440];
var skipMinutes = 0;

var getAllMatches = function(callback) {
    console.log('getAllMatches start...');
    var leaguesObject = {};
    var options = {
      'host': 'api.football-data.org'
    };

    async.each(leagueIdArray, function(league, async_cb) {
        options.path =  '/v1/competitions/' + league + '/fixtures';
        leaguesObject[league] = '';

        var requestCallback = function(response) {
            response.on('data', function (chunk) {
                leaguesObject[league] += chunk;
            });

            response.on('end', function () {
                leaguesObject[league] = JSON.parse(leaguesObject[league]);

                schedule.updateMatches({
                    'matches': leaguesObject[league].fixtures
                }, function(result) {
                    callback();
                });
            });
        }

        http.request(options, requestCallback).end();
    }, function(async_err) {
        console.log('getAllMatches finished...');
        callback();
    });
};

var liveChekcer = function(callback) {
    if ((__matchList.count > 0) && (skipMinutes == 0)) {
        var data = '';
        var options = {
          'host': 'api.football-data.org',
          'path': '/v1/fixtures?timeFrame=p1&league=PL,FAC,BL1,DFB,DED,FL1,PD,SA,PPL,CL'
        };

        var requestCallback = function(response) {
            response.on('data', function (chunk) {
                data += chunk;
            });

            response.on('end', function () {
                console.log('p1');
                data = JSON.parse(data);

                schedule.updateMatches({
                    'matches': data.fixtures
                }, function(result) {
                    var _data = '';
                    var _options = {
                      'host': 'api.football-data.org',
                      'path': '/v1/fixtures?timeFrame=n1&league=PL,FAC,BL1,DFB,DED,FL1,PD,SA,PPL,CL'
                    };

                    var _requestCallback = function(_response) {
                        _response.on('_data', function (_chunk) {
                            _data += _chunk;
                        });

                        _response.on('end', function () {
                            console.log('n1');
                            _data = JSON.parse(_data);

                            schedule.updateMatches({
                                'matches': _data.fixtures
                            }, function(result) {
                                callback();
                            });
                        });
                    }

                    http.request(_options, _requestCallback).end();
                });
            });
        };

        http.request(options, requestCallback).end();
    } else {
        callback();
    }
};

var tester = function(callback) {
    var _current_time = new Date();
    db.match.find({
        'leagueId': '999'
    }).exec(function(err, data) {
        async.each(data, function(match, a_c) {
            match._links = {
                'self': {
                    'href': '/' + match.id
                }
            };

            if (match.date > _current_time) {
                match.status = 'TIMED';
            } else {
                if (match.date < new Date(_current_time.getTime() - 1000 * 120)) {
                    match.status = 'FINISHED';
                    match.result = {
                        'goalsHomeTeam': Math.floor(Math.random() * 4) + 1,
                        'goalsAwayTeam': Math.floor(Math.random() * 4) + 1
                    }
                } else {
                    match.status = 'IN_PLAY';
                }
            }

            a_c();
        }, function() {
            schedule.updateMatches({
                'matches': data
            }, function(result) {
                callback();
            });
        });
    });
};

exports.start = function() {
    var self = this;

    node_schedule.scheduleJob('*/10 * * * * *', function(){
        var currentTime = new Date();
        var currentMinutes = currentTime.getMinutes();
        var currentSeconds = currentTime.getSeconds();

        var doFunction;

        if (__run_first || ((currentMinutes == 0) && (currentSeconds == 0))) {
            if (__run_first) {
                __run_first = false;
                chat.closeRoomAll();
            }

            skipMinutes = 6;
            doFunction = getAllMatches;
            console.log('getAllMatches');
        } else {
            skipMinutes = skipMinutes > 0 ? skipMinutes - 1 : skipMinutes;
            doFunction = liveChekcer;
            console.log('liveChekcer');
        }

        // chat.closeRoomAll();
        // doFunction = tester;

        doFunction(function() {
            console.log('doFunction end...');
            schedule.setLiveMatch(function() {
                chat.controlRoom();
            });
        });
    });
};
