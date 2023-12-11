const express = require("express");
const router = express.Router();
const passport = require("passport")
const accessController = require("../controllers/AccessController")

router.get("/", accessController.index);

router.get("/login", accessController.loginPage);

router.get('/logout', accessController.logout);

router.get("/forgotpassword", accessController.forgotpasswordPage);

router.post("/forgotpassword", accessController.forgotpassword);

router.get("/changepassword/:userId/:uniqueString", accessController.changepassword);

router.post("/changepassword/:userId/:uniqueString", accessController.setNewpassword);

//Login with local passport 
router.post("/login", accessController.login,
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    accessController.checkIsAdmin);

//Login with google
router.get('/auth/google', passport.authenticate('google', { scope: [ 'email', 'profile' ] }));

//gg call back
router.get('/auth/google/callback',
      passport.authenticate( 'google', { failureRedirect: '/login', failureFlash: true}), 
      accessController.checkIsAdmin);

router.get("/unauthenticated", accessController.unauthenticated)

router.get("/notfound", accessController.notfound)

module.exports = router;
