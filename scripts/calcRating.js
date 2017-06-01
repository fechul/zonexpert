var mongoose = require('mongoose');
var async = require('async');
var md5 = require('md5');
var session = require('express-session');
var redis_store = require('connect-redis')(session);
var redis = require('redis');
global.redis_client = redis.createClient();

var rating = require('../core/rating.js');

var mongoose_db = mongoose.connection;
mongoose_db.on('error', console.error);
mongoose_db.once('open', function() {
    console.log("Connected to mongd server");
});

mongoose.connect('mongodb://localhost');

global.db = require('../db/schema.js');

var matchIdList = [
    '154508',
    '154509',
    '158902',
    '158901',
    '154510',
    '154516',
    '154515',
    '154513',
    '154517',
    '154514',
    '154512',
    '154511'
];

async.eachSeries(matchIdList, function(matchId, a_cb) {
    rating.addQueue({
        'matchId': matchId
    }, function(result) {
        a_cb();
    });
}, function() {
    console.log('hi');
});
