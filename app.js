var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
var serveStatic = require('serve-static')

var compression = require('compression');
var helmet = require('helmet');
var bodyParser = require('body-parser')

require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(compression());
app.use(helmet());

var mongoose = require('mongoose');

var mongoDB = process.env.DB_LINK;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo.db connection error: '));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.options('*', cors());


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/public', serveStatic(path.join(__dirname, 'public/')));

module.exports = app;
