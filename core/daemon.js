var node_schedule = require('node-schedule');
var http = require('http');
var async = require('async');
var cheerio = require("cheerio");
var spawn = require('child_process').spawn;
var $;

var schedule = require('./schedule.js');
var chat = require('./chat.js');

var sportsArray = [1, 2];
// 1 football 2 baseball
var leagueIdArray = [426, 429, 430, 432, 433, 434, 436, 438, 439, 440];
// var leagueIdArray = [440];
var getAllMatchesUpdating = false;

var getAllMatches = function(callback) {
    winston.info('getAllMatches start...');

    var football = function(footballCallback) {
        winston.info('  football getAllMatches start...');
        var leaguesObject = {};
        var options = {
          'host': 'api.football-data.org',
          'headers': {
              'X-Auth-Token': __footballDataApiToken
          }
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
                        async_cb();
                    });
                });
            }

            http.request(options, requestCallback).end();
        }, function(async_err) {
            winston.info('  football getAllMatches finish...');
            footballCallback(null);
        });
    };

    var baseball = function(baseballCallback) {
        winston.info('  baseball getAllMatches start...');
        var task = spawn('casperjs', ['scripts/casper_kbo_all.js', '--proxy-type=none']);
        var received_data = ''

        task.stdout.on('data', (data) => {
            received_data += data.toString();
        });

        task.on('close', (code) => {
            delete $;
            $ = cheerio.load(received_data)
            var tr = $('#tblSchedule tbody tr');
            var currentDate = new Date();
            var currentYear = currentDate.getFullYear();
            var matchDay;

            var teamIdObj = {
                '두산': 'kbo1',
                'NC': 'kbo2',
                '넥센': 'kbo3',
                'LG': 'kbo4',
                'KIA': 'kbo5',
                'SK': 'kbo6',
                '한화': 'kbo7',
                '롯데': 'kbo8',
                '삼성': 'kbo9',
                'kt': 'kbo10'
            };

            var matchList = [];

            for (var i = 0; i < tr.length; i++) {
                var row = tr.eq(i);
                var tdClassDay = row.find('td.day');
                var tdClassTime = row.find('td.time').eq(0);
                var tdClassPlay = row.find('td.play').eq(0);
                var awayTeamName = tdClassPlay.find('span').first().text();
                var homeTeamName = tdClassPlay.find('span').last().text();

                if (tdClassDay.length) {
                    matchDay = tdClassDay.eq(0).text();
                }

                var MatchDate = new Date(currentYear + ' ' + matchDay + ' ' + tdClassTime.text());

                var obj = {
                    'id': '',
                    'leagueId': 'kbo2017',
                    'date' : MatchDate,
                    'homeTeamName' : homeTeamName,
                    'awayTeamName' : awayTeamName,
                    'homeTeamId': teamIdObj[homeTeamName],
                    'awayTeamId': teamIdObj[awayTeamName],
                    'status': ''
                };

                var tdClassRelay = row.find('td.relay').eq(0);

                var tdClassRelay_a = tdClassRelay.find('a');
                if (tdClassPlay.find('em span').length == 3) {
                    if (tdClassRelay_a.length) {
                        if (tdClassRelay_a.text() == '리뷰') {
                            // 경기 종료
                            var goalsHomeTeam = parseInt(tdClassPlay.find('em span').last().text(), 10);
                            var goalsAwayTeam = parseInt(tdClassPlay.find('em span').first().text(), 10);
                            var result = {
                                'goalsHomeTeam': goalsHomeTeam,
                                'goalsAwayTeam': goalsAwayTeam
                            };

                            obj.result = result;
                            obj.status = 'FINISHED';
                        } else if (tdClassRelay_a.text() == '프리뷰') {
                            // 경기 시작 전
                            obj.status = 'TIMED';
                        }
                    } else {
                        // 경기 중
                        obj.status = 'IN_PLAY';
                    }
                } else {
                    var etcText = row.find('td').last().text();
                    if (etcText == '우천취소') {
                        // 우천 취소
                        obj.status = 'POSTPONED_RAIN';
                    } else {
                        // 예정 됨
                        obj.status = 'SCHEDULED';
                    }
                }

                matchList.push(obj);
            }

            schedule.updateMatches({
                'matches': matchList
            }, function(result) {
                winston.info('  baseball getAllMatches finish...');
                baseballCallback();
            });
        });
    };

    var waterfallFunctionList = [];

    for (var i = 0; i < sportsArray.length; i++) {
        if (sportsArray[i] == 1) {
            waterfallFunctionList.push(football);
        } else if (sportsArray[i] == 2) {
            waterfallFunctionList.push(baseball);
        }
    }

    async.waterfall(waterfallFunctionList, function() {
        getAllMatchesUpdating = false;
        winston.info('getAllMatches finish...');

        callback();
    });
};

var liveChekcer = function(callback) {
    if ((__matchList.count > 0) && !getAllMatchesUpdating) {
        getAllMatchesUpdating = true;
        winston.info('liveChekcer start...');
        var football = function(footballCallback) {
            winston.info('  football liveChekcer start...');
            var data = '';
            var options = {
              'host': 'api.football-data.org',
              'path': '/v1/fixtures?timeFrame=p1&league=PL,FAC,BL1,DFB,DED,FL1,PD,SA,PPL,CL',
              'headers': {
                  'X-Auth-Token': __footballDataApiToken
              }
            };

            var requestCallback = function(response) {
                response.on('data', function (chunk) {
                    data += chunk;
                });

                response.on('end', function () {
                    var parsedData = '';
                    try {
                        parsedData = JSON.parse(data);
                    } finally {
                        if (parsedData) {
                            schedule.updateMatches({
                                'matches': parsedData.fixtures
                            }, function(result) {
                                var _data = '';
                                var _options = {
                                  'host': 'api.football-data.org',
                                  'path': '/v1/fixtures?timeFrame=n1&league=PL,FAC,BL1,DFB,DED,FL1,PD,SA,PPL,CL',
                                  'headers': {
                                      'X-Auth-Token': __footballDataApiToken
                                  }
                                };

                                var _requestCallback = function(_response) {
                                    _response.on('_data', function (_chunk) {
                                        _data += _chunk;
                                    });

                                    _response.on('end', function () {
                                        var _parsedData = '';
                                        try {
                                            _parsedData = JSON.parse(_data);
                                        } finally {
                                            if (_parsedData) {
                                                schedule.updateMatches({
                                                    'matches': _data.fixtures
                                                }, function(result) {
                                                    winston.info('  football liveChekcer finish...');
                                                    footballCallback();
                                                });
                                            } else {
                                                winston.info('  football liveChekcer finish...');
                                                footballCallback();
                                            }
                                        }
                                    });
                                }

                                http.request(_options, _requestCallback).end();
                            });
                        } else {
                            var _data = '';
                            var _options = {
                              'host': 'api.football-data.org',
                              'path': '/v1/fixtures?timeFrame=n1&league=PL,FAC,BL1,DFB,DED,FL1,PD,SA,PPL,CL',
                              'headers': {
                                  'X-Auth-Token': __footballDataApiToken
                              }
                            };

                            var _requestCallback = function(_response) {
                                _response.on('_data', function (_chunk) {
                                    _data += _chunk;
                                });

                                _response.on('end', function () {
                                    var _parsedData = '';
                                    try {
                                        _parsedData = JSON.parse(_data);
                                    } finally {
                                        if (_parsedData) {
                                            schedule.updateMatches({
                                                'matches': _data.fixtures
                                            }, function(result) {
                                                winston.info('  football liveChekcer finish...');
                                                footballCallback();
                                            });
                                        } else {
                                            winston.info('  football liveChekcer finish...');
                                            footballCallback();
                                        }
                                    }
                                });
                            }

                            http.request(_options, _requestCallback).end();
                        }
                    }
                });
            };

            http.request(options, requestCallback).end();
        };

        var baseball = function(baseballCallback) {
            winston.info('  baseball liveChekcer start...');
            var task = spawn('casperjs', ['scripts/casper_kbo_live.js', '--proxy-type=none']);
            var received_data = ''

            task.stdout.on('data', (data) => {
                received_data += data.toString();
            });

            task.on('close', (code) => {
                delete $;
                $ = cheerio.load(received_data)
                var smsScore = $('.smsScore');
                var currentDay = $('.today span').eq(0).text();

                var matchList = [];

                var teamIdObj = {
                    '두산': 'kbo1',
                    'NC': 'kbo2',
                    '넥센': 'kbo3',
                    'LG': 'kbo4',
                    'KIA': 'kbo5',
                    'SK': 'kbo6',
                    '한화': 'kbo7',
                    '롯데': 'kbo8',
                    '삼성': 'kbo9',
                    'kt': 'kbo10'
                };

                for (var i = 0; i < smsScore.length; i++) {
                    var $this = smsScore.eq(i);
                    var time = $this.find('.place span').eq(0).text();
                    var MatchDate = new Date(currentDay + ' ' + time);
                    var status = '';

                    var awayTeamName = $this.find('.score_wrap .leftTeam .teamT').eq(0).text();
                    var homeTeamName = $this.find('.score_wrap .rightTeam .teamT').eq(0).text();
                    var goalsAwayTeam = parseInt($this.find('.score_wrap .leftTeam .score span').eq(0).text() || 0, 10);
                    var goalsHomeTeam = parseInt($this.find('.score_wrap .rightTeam .score span').eq(0).text() || 0, 10);
                    var statusTxt = $this.find('.score_wrap > .flag span').eq(0).text();

                    if (statusTxt == '경기전') {
                        status = 'TIMED';
                    } else if (statusTxt == '경기종료') {
                        status = 'FINISHED';

                    } else {
                        status = 'IN_PLAY';
                    }

                    var obj = {
                        'id': '',
                        'leagueId': 'kbo2017',
                        'date' : MatchDate,
                        'homeTeamName' : homeTeamName,
                        'awayTeamName' : awayTeamName,
                        'homeTeamId': teamIdObj[homeTeamName],
                        'awayTeamId': teamIdObj[awayTeamName],
                        'status': status
                    };

                    if ((status == 'FINISHED') || (status == 'IN_PLAY')) {
                        obj.result = {
                            'goalsHomeTeam': goalsHomeTeam,
                            'goalsAwayTeam': goalsAwayTeam
                        };
                    }

                    matchList.push(obj);
                }

                schedule.updateMatches({
                    'matches': matchList
                }, function(result) {
                    winston.info('  baseball liveChekcer finish...');
                    baseballCallback();
                });
            });
        };

        var waterfallFunctionList = [];

        for (var i = 0; i < sportsArray.length; i++) {
            if (sportsArray[i] == 1) {
                waterfallFunctionList.push(football);
            } else if (sportsArray[i] == 2) {
                waterfallFunctionList.push(baseball);
            }
        }

        async.waterfall(waterfallFunctionList, function() {
            getAllMatchesUpdating = false;
            callback();
        });
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

var voidFunction = function(callback) {
    callback();
};

exports.start = function() {
    var self = this;

    node_schedule.scheduleJob('*/10 * * * * *', function(){
        var currentTime = new Date();
        var currentHours = currentTime.getHours();
        var currentMinutes = currentTime.getMinutes();
        var currentSeconds = currentTime.getSeconds();

        var doFunction;

        if (__service_mode) {
            if (__run_first || ((currentMinutes == 0) && (currentSeconds == 0))) {
                if (__run_first) {
                    __run_first = false;
                }

                getAllMatchesUpdating = true;
                doFunction = getAllMatches;
            } else {
                doFunction = liveChekcer;
                // console.log('liveChekcer');
            }
        } else {
            // doFunction = tester;
            doFunction = voidFunction;
        }

        doFunction(function() {
            // console.log('doFunction end...');
            schedule.setLiveMatch(function() {
                chat.controlRoom();
            });
        });
    });
};

exports.resetAttendance = function() {
    var rule = new node_schedule.RecurrenceRule();
    rule.dayOfWeek = [node_schedule.Range(0, 6)];
    rule.hour = 0;
    rule.minute = 0;

    var reset = node_schedule.scheduleJob(rule, function() {
        db.user.update({},{
            $set: {
                'todayAttendancePoint': false
            }
        }, {
            multi: true
        }, function(err) {

        });
    });
};
