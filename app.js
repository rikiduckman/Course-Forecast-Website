require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('./src/config/passport');
const connectDB = require('./src/config/dbUser');
const connectDBModels = require('./src/config/dbModel');
const authRoutes = require('./src/middleware/googleAuth');
const moment = require('moment');
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();
connectDBModels();

// Middleware for sessions
app.use(session({
  secret: process.env.SECRET_KEY || 'default_secret_key',
  resave: false,
  saveUninitialized: false,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set template engine
app.set('view engine', 'ejs');
app.set('layout', './layouts/main');
app.use(expressLayouts);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./src/routes/routes'));
app.use('/auth', authRoutes);

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});
app.locals.moment = moment;
// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
