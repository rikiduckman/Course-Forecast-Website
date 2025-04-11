const express = require('express');
const passport = require('../config/passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    if (!req.user || !req.user.emails || req.user.emails.length === 0) {
      return res.redirect('/login'); 
    }
    const email = req.user.emails[0].value;
    
    if (email.endsWith('@mail.rmutk.ac.th')) {
      if (email === process.env.ADMIN_ID || email === process.env.ADMIN_ID2) {
        req.user.role = 'admin';
        return res.redirect('/admin?login=success');
      } else {
        req.user.role = 'user';
        return res.redirect('/user?login=success');
      }
    } else {
      req.logout(() => {
        return res.redirect(`/?invalidEmail=true`);
      });
    }
  }
);

module.exports = router;