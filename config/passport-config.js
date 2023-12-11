const LocalStrategy = require("passport-local").Strategy
const userController = require('../services/UserService');
const bcrypt = require("bcrypt")
const accountService = require('../services/AccountService');
const Account = require('../models/Account');
const User = require('../models/User');
const userService = require('../services/UserService');

//Login passport 
function initialize(passport) {
    const authenticateUsers = async (username, password, done) => {
        username = username.trim();
        password = password.trim();
        const result = await accountService.getAccountByUsername(username);
        if (result.status === true) {
            const account = result.data;
            //Tồn tại tài khoản
            if (account != null) {
                if (await bcrypt.compare(password, account.password)) {
                    //Lấy user + account đưa vào passport
                    const userData = await userService.getUserById(account.userId);
                    const user = userData.data;
                    return done(null, user);
                }
                else {
                    return done(null, false, { message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
                }
            }
        } else {
            return done(null, false, { message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
    }
    passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUsers))
    passport.serializeUser((user, done) => done(null, user._id))
    passport.deserializeUser(async (id, done) => {
        const userData = await userController.getUserById(id);
        const user = userData.data;
        return done(null, user)
    })
}

module.exports = initialize







