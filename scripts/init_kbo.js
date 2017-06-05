var mongoose = require('mongoose');
var async = require('async');

var rating = require('../core/rating.js');

var mongoose_db = mongoose.connection;
mongoose_db.on('error', console.error);
mongoose_db.once('open', function() {
    console.log("Connected to mongd server");
});

mongoose.connect('mongodb://localhost');

global.db = require('../db/schema.js');

var teamList = [{
    'id': 'kbo1',
    'leagueId': 'kbo2017',
    'name': '두산 베어스',
    'shortName': '두산',
    'crestUrl': '/image/kbo_emblem/doosan.png'
}, {
    'id': 'kbo2',
    'leagueId': 'kbo2017',
    'name': 'NC 다이노스',
    'shortName': 'NC',
    'crestUrl': '/image/kbo_emblem/nc.png'
}, {
    'id': 'kbo3',
    'leagueId': 'kbo2017',
    'name': '넥센 히어로즈',
    'shortName': '넥센',
    'crestUrl': '/image/kbo_emblem/nexen.png'
}, {
    'id': 'kbo4',
    'leagueId': 'kbo2017',
    'name': 'LG 트윈스',
    'shortName': 'LG',
    'crestUrl': '/image/kbo_emblem/lg.png'
}, {
    'id': 'kbo5',
    'leagueId': 'kbo2017',
    'name': 'KIA 타이거즈',
    'shortName': 'KIA',
    'crestUrl': '/image/kbo_emblem/kia.png'
}, {
    'id': 'kbo6',
    'leagueId': 'kbo2017',
    'name': 'SK 와이번스',
    'shortName': 'SK',
    'crestUrl': '/image/kbo_emblem/sk.png'
}, {
    'id': 'kbo7',
    'leagueId': 'kbo2017',
    'name': '한화 이글스',
    'shortName': '한화',
    'crestUrl': '/image/kbo_emblem/hanhwa.png'
}, {
    'id': 'kbo8',
    'leagueId': 'kbo2017',
    'name': '롯데 자이언츠',
    'shortName': '롯데',
    'crestUrl': '/image/kbo_emblem/lotte.png'
}, {
    'id': 'kbo9',
    'leagueId': 'kbo2017',
    'name': '삼성 라이온즈',
    'shortName': '삼성',
    'crestUrl': '/image/kbo_emblem/samsung.png'
}, {
    'id': 'kbo10',
    'leagueId': 'kbo2017',
    'name': 'kt wiz',
    'shortName': 'kt',
    'crestUrl': '/image/kbo_emblem/kt.png'
}];

async.eachSeries(teamList, function(team, a_cb) {
    var newTeam = new db.team(team);
    newTeam.save(function() {
        a_cb();
    });
}, function() {
    console.log('hi');
});
