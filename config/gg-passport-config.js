const GoogleStrategy = require('passport-google-oauth2').Strategy;
const userController = require('../services/UserService');

async function initializeGooglePassport(passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `http://localhost:${process.env.PORT}/auth/google/callback`,
        passReqToCallback: true
    },
    async function (request, accessToken, refreshToken, profile, done) {
        const user = await userController.getUserByEmail(profile.email);
        if (user.status) {
            //console.log(profile)
            return done(null, user.data);
        } else {
            //Không tồn tại tài khoản trong hệ thống
            return done(null, false, { message: 'Tài khoản không tồn tại trong hệ thống.' });
        }
    }));
    //mã hóa với user Id
    passport.serializeUser((user, done) => done(null, user._id))
    //giải mã trả về user info
    passport.deserializeUser(async (id, done) => {
        const userData = await userController.getUserById(id);
        const user = userData.data;
        return done(null, user)
    })
}

module.exports = initializeGooglePassport;
