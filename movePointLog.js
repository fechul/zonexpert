var mongoose = require('mongoose');
var async = require('async');

var mongoose_db = mongoose.connection;
mongoose_db.on('error', console.error);
mongoose_db.once('open', function() {
    console.log("Connected to mongd server");
});

mongoose.connect('mongodb://localhost');

db = require('./db/schema.js');

// db.user.find({}, function(err, data) {
//     async.each(data, function(user, async_cb) {
//         var pointLog = user.pointLog;
//         async.mapSeries(pointLog, function(log, _async_cb) {
//             log = JSON.stringify(log);
//             log = JSON.parse(log);
//             log.userEmail = user.email;
//             var moveLog = new db.point(log);
//             moveLog.save(function(_err, move) {
//                 if(_err) {
//                     console.log("**********fail: ",user.email, _err);
//                 } else {
//                     console.log("success!");
//                 }
//                 _async_cb();
//             });
//         }, function(_async_err) {
//             async_cb();
//         });
//     }, function(async_err) {
//         console.log("done!");
//     });
// });

db.user.update({}, {
    $unset: {
        'pointLog': 1
    }
}, {multi:true}, function(err, update) {
    if(err) {
        console.log("err: ", err);
    } else {
        console.log("suc: ", update);
    }
});
