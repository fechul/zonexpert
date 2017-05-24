var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var async = require('async');
var fs = require('fs');

var set_configs = function() {
    var configs_read = fs.readFileSync('./configs.json', 'utf8');
    configs_read = JSON.parse(configs_read);

    var keys = Object.keys(configs_read);

    for (var i = 0; i < keys.length; i++) {
        global['__' + keys[i]] = configs_read[keys[i]];
    }

    console.log('set configs complete');
}();

if (__port.length > 0) {
    global.__url = 'http://' + __host + ':' + __port;
} else {
    global.__url = 'http://' + __host;
}
global.__matchList = {
    'count': 0,
    'TIMED': [],
    'IN_PLAY': [],
    'FINISHED': []
};

// redis
var session = require('express-session');
var redis_store = require('connect-redis')(session);
var redis = require('redis');
global.redis_client = redis.createClient();

var index_routes = require('./routes/index.js');
var view_routes = require('./routes/view.js');

var app = express();

var mongoose_db = mongoose.connection;
mongoose_db.on('error', console.error);
mongoose_db.once('open', function() {
    console.log("Connected to mongd server");
});

mongoose.connect('mongodb://localhost');

global.db = require('./db/schema.js');

var daemon = require('./core/daemon.js');

daemon.start();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    'store': new redis_store({
        'host': 'localhost',
        'port': 6379,
        'client': redis_client,
        'resave': false
    }),
    'secret': 'dududududu',
    'saveUninitialized': false,
    'resave': false
}));

// mobile checker -> req.is_mobile = true | false
app.use(function(req, res, next) {
    req.is_mobile = /mobile/i.test(req.headers['user-agent']) || /android/i.test(req.headers['user-agent']);
    next();
});

//routing
app.use('/', index_routes);
app.use('/', view_routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.send('error');
});

module.exports = app;
