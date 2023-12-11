const express = require("express");
const app = express();
const hbs = require('express-handlebars').engine;
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
var methodOverride = require('method-override')
require('dotenv').config({ path: './config/.env' });
const port = process.env.PORT;
const initializePassport = require('./config/passport-config');
const initializeGooglePassport = require('./config/gg-passport-config');

//gg passport config
initializeGooglePassport(passport);
//local passport config
initializePassport(passport);

const customHelpers = require('./utils/customHelpers');
app.engine('hbs', hbs({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: {
    ...customHelpers.helpers
  }
}))
app.set('view engine', 'hbs')
app.set('views', './views');
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))

app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
  }
}));
app.use(flash());
//initalizepassport config
app.use(passport.initialize());
app.use(passport.session());

//connect dtb
const db = require('./config/db');
db.connect();

app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});

app.use("/", require("./routes/access"));

//Authentication
app.use(function (req, res, next) {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
    return next();
  }
  else {
    //Trả về trang 401
    res.redirect('/Unauthenticated');
  }
})

app.use("/user", require("./routes/user"));

//authorization
app.use(function (req, res, next) {
  if (res.locals.user.userEmail == "admin@gmail.com") {
    return next();
  }
  else {
    //Trả về trang 404
    res.redirect('/notfound');
  }
})

app.use("/admin", require("./routes/admin"));

//page not found
app.use(function (req, res) {
  res.redirect("/notfound")
})


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
