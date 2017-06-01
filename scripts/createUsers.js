var mongoose = require('mongoose');
var async = require('async');
var md5 = require('md5');

// var users = require('./core/user.js');

var mongoose_db = mongoose.connection;
mongoose_db.on('error', console.error);
mongoose_db.once('open', function() {
    console.log("Connected to mongd server");
});

mongoose.connect('mongodb://localhost');

global.db = require('../db/schema.js');

var userList = [];
var nicknameList = [
    '정상픽입니다', 'PD수첩', 'anjfqhktlqkfdk', '강아지탕', '지정현님',
    '멍aaa', 'SaintEmilia', '간다간다뿅간다잉', 'Brotulaaa', '정관장a',
    'Spark', 'ㄴㅇㄴㅇ', 'afdljqe', '12938nladnf', 'zzzzzzzzzzzzz',
    'whsansrkektzja', 'choips', '실화', '탱탱한복숭아', 'UDAL',
    'PPPPPPP', '910223', '축잘알', '호날두짱', '호우우우우우우',
    '메좆', '황족첼시', '맨더빅아', 'FCB', '맞추기고수',
    'MarcoReus'
];

for (var i = 1; i <= nicknameList.length; i++) {
    var getMainLeague = function() {
        var pickRandNum = Math.floor((Math.random() * 100)) + 1;

        if (pickRandNum <= 50) {
            return 426;
        } else if (pickRandNum <= 75) {
            return 436;
        } else if (pickRandNum <= 90) {
            return 430;
        } else {
            return 438;
        }
    };

    userList.push({
            'email': 'test' + i + '@zonexperts.com',
            'nickname': nicknameList[i-1],
            'password': md5('123123a!'),
            'authed': true,
            'signup_date': new Date('2017-05-26 17:03:26'),
            'main_sport': 1,
            'main_league': pickRandNum()
    });
};

async.each(userList, function(user, a_cb) {
    var new_user = new db.user(user);
    new_user.save(function() {
        a_cb();
    });
}, function() {
    console.log('user create complete');
});
