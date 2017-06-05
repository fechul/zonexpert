var session = require('express-session');
var redis_store = require('connect-redis')(session);
var redis = require('redis');
var async = require('async');
global.redis_client = redis.createClient();

var mongoose = require('mongoose');
var mongoose_db = mongoose.connection;
mongoose_db.on('error', console.error);
mongoose_db.once('open', function() {
    console.log("Connected to mongd server");
});

mongoose.connect('mongodb://localhost');

var db = require('./db/schema.js');

var keys = ['rating_rank', 'game_cnt_rank', 'predict_rate_rank'];

db.user.find({
	'readyGameCnt': {
		$gt: 0
	}
}, function(err, readyData) {
	if(readyData && readyData.length) {
		async.each(readyData, function(ready, async_cb) {
			async.each(keys, function(key, _async_cb) {
				redis_client.zrem(key, ready.email, function(err, data) {
					console.log(key + ': ' + ready.email + '(removed)');
					_async_cb();
				});
			}, function(_async_err) {
				async_cb();
			});
		}, function(async_err) {
			console.log("Redis에서 배치중인 Users 제거 완료");
		});
	}
});
