var async = require('async');

exports.update_schedule = function(data, callback) {
    if(data && data.length) {
      //data = JSON.parse(data);


      //db업데이트
      async.each(data, function(schedule, async_cb) {
        console.log("schedule: ", schedule);
        async_cb();
      }, function(async_err) {
        console.log(async_err);
      });
    } else {
      callback(null);
    }
};
