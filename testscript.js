var cheerio = require("cheerio");
var spawn = require('child_process').spawn;
var $;

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
});
