var db = {};
var async = require('async');
db.schedule = require('../db/schedule.js');

exports.update_schedule = function(data, callback) {
    if(data && data.length) {
      data = JSON.parse(data);

      //db업데이트
      async.each(data, function(schedule, async_cb) {
        console.log("schedule: ",schedule);
      }, function(async_err) {
        async_cb();
      });
    } else {
      callback(null);
    }
};
