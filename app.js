var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const pgp = require('pg-promise')();
const dbUrl = process.env.DATABASE_URL || 'postgres://myuser:mypassword@localhost:5434/mydatabase';
const db = pgp(dbUrl);
const session = require('./session');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var clientsRouter = require('./routes/clients');
var ordersRouter = require('./routes/orders');
var productsRouter = require('./routes/products');
var statsRouter = require('./routes/stats');

var app = express();

app.use(function(req, res, next) {
  req.db = db;
  next();
});

app.use(cookieParser());

app.use(function(req, res, next) {
  let auth = session.auth(req);
  req.user = auth && auth.user ? auth.user : null;
  res.locals.user = req.user;
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/clients', clientsRouter);
app.use('/orders', ordersRouter);
app.use('/products', productsRouter);
app.use('/stats', statsRouter);
let api = require('./routes/api');
app.use('/api', api);
let api_auth = require('./routes/api/auth');
api.use('/auth', api_auth);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

db.one('SELECT $1 AS value', 123)
  .then((data) => {
  console.log('DATA:', data.value)
})
.catch((error) => {
  console.log('ERROR:', error)
})
module.exports = app;
