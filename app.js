global.__host = '127.0.0.1';
global.__port = '3000';
global.__url = 'http://' + __host + ':' + __port;
global.__admin_email = 'zonexpert0@gmail.com';
global.__admin_password = 'whsansrk123!';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var routes = require('./routes');

var index = require('./routes/index');

var app = express();

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

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
    console.log("Connected to mongd server");
});

mongoose.connect('mongodb://localhost');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	if (false) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	} else {
		next();
	}
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

// routing

app.get('/', routes.index);
app.get('/signup', routes.signup);

app.post('/join', routes.join);
app.get('/auth/join', routes.auth.join);
// app.post('/auth/join', routes.auth.join);


var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('앱은 http://%s:%s 에서 작동 중입니다.', host, port);
});


module.exports = app;
