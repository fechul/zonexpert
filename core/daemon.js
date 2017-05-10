var node_schedule = require('node-schedule');
var http = require('http');
var async = require('async');

var schedule = require('./schedule.js');

// var leagueIdArray = [426, 429, 430, 432, 433, 434, 436, 438, 439, 440];
var leagueIdArray = [426];

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

var liveChekcer = function(currentTime, callback) {
    if (__matchList.count > 0) {
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
                data = JSON.parse(data);

                schedule.updateMatches({
                    'matches': data.fixtures
                }, function(result) {
                    var _data = '';
                    var _options = {
                      'host': 'api.football-_data.org',
                      'path': '/v1/fixtures?timeFrame=n1&league=PL,FAC,BL1,DFB,DED,FL1,PD,SA,PPL,CL'
                    };

                    var requestCallback = function(_response) {
                        _response.on('_data', function (_chunk) {
                            _data += _chunk;
                        });

                        _response.on('end', function () {
                            _data = JSON.parse(_data);

                            schedule.updateMatches({
                                'matches': _data.fixtures
                            }, function(result) {
                                callback();
                            });
                        });
                    }

                    http.request(_options, requestCallback).end();
                });
            });
        }

        http.request(options, requestCallback).end();
    } else {
        callback();
    }
};

exports.start = function() {
    var self = this;

    node_schedule.scheduleJob('*/10 * * * * *', function(){
        var currentTime = new Date();
        var currentMinutes = currentTime.getMinutes();
        var currentSeconds = currentTime.getSeconds();

        var doFunction;

        if ((currentMinutes == 0) && (currentSeconds == 0)) {
            doFunction = getAllMatches;
        } else {
            doFunction = liveChekcer;
        }

        doFunction(function() {
            schedule.setComingUpMatch(function() {

            });
        });
    });
};
