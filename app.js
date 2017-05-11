global.__host = '127.0.0.1';
global.__port = '3000';
global.__url = 'http://' + __host + ':' + __port;
global.__admin_email = 'zonexpert0@gmail.com';
global.__admin_password = 'whsansrk123!';
global.__matchList = {
    'count': 0,
    'TIMED': [],
    'IN_PLAY': [],
    'FINISHED': []
};
global.__run_first = true;
global.__do_daemon = false;

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var async = require('async');

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

if (__do_daemon) {
    daemon.start();
}

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
