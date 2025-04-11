module.exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/?notLoggedIn=true');
  }
};

module.exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.emails && req.user.emails[0].value && (req.user.emails[0].value === process.env.ADMIN_ID || req.user.emails[0].value === process.env.ADMIN_ID2)) {
    return next();
  } else {
    res.redirect('/login');
  }
};

module.exports.ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  } else if (req.isAuthenticated() && req.user.role === 'user') {
    res.redirect('/user?unauthorized=true');
  } else {
    res.redirect('/?notLoggedIn=true');
  }
};

module.exports.ensureUser = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'user') {
    return next();
  } else if (req.isAuthenticated() && req.user.role === 'admin') {
    res.redirect('/admin?unauthorized=true');
  } else {
    res.redirect('/?notLoggedIn=true');
  }
};