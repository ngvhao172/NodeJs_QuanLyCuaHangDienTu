const accountService = require('../services/AccountService');
const Account = require('../models/Account');
const User = require('../models/User');
const userService = require('../services/UserService');
const userVerificationService = require('../services/UserVerificationService');
const bcrypt = require('bcrypt');

class AccessController {

    async index(req, res, next) {
        res.redirect("/login");
    }
    async loginPage(req, res, next) {
        //Thêm tài khoản user mẫu để dễ fix FE
        const userAccountExist = await accountService.getAccountByUsername("user")
        if (!userAccountExist.data) {
            const user = new User({ fullName: "user", userEmail: "user@gmail.com" })
            await userService.createUser(user);
            const hasedPassword = await bcrypt.hash("user", 10);
            const userAccount = new Account({ userId: user._id, userEmail: "user@gmail.com", userName: "user", password: hasedPassword, verified: true, enabled: true, changePassword: true });
            await accountService.createAccount(userAccount);
        }
        res.render("pages/login", { layout: null });
    }
    async login(req, res, next) {
        const { username, password } = req.body;
        const result = await accountService.getAccountByUsername(username);
        //tồn tại tài khoản
        if (result.status == true) {
            const account = result.data;
            if (account) {
                const hasedPassword = await bcrypt.hash(password, 10);
                if (bcrypt.compare(account.password, hasedPassword)) {
                    return next();
                }
                else {
                    req.flash('type', 'danger');
                    req.flash('message', 'Tên đăng nhập hoặc mật khẩu không đúng');
                    return res.redirect("/login",);
                }
            }
        }
        //không tồn tại tài khoản
        else {
            //tạo tài khoản admin
            if (username === "admin" && password === "admin") {
                try {
                    // Tạo tài khoản admin
                    const hasedPassword = await bcrypt.hash(password, 10);
                    const newAdmin = new User({ fullName: "Admin", userEmail: "admin@gmail.com" });
                    const adminResult = await userService.createUser(newAdmin);

                    if (adminResult.status === true) {
                        const newAccount = new Account({
                            userId: adminResult.data._id,
                            userName: username,
                            userEmail: "admin@gmail.com",
                            password: hasedPassword,
                            verified: true,
                            changePassword: true,
                            enable: true,
                        });

                        const accountResult = await accountService.createAccount(newAccount);

                        if (accountResult.status === true) {
                            console.log("Tài khoản admin đã được tạo thành công.");
                            return next();
                        } else {
                            req.flash('type', 'danger');
                            req.flash('message', "Lỗi khi tạo tài khoản admin: ", accountResult.message);
                            return res.redirect("/login");
                        }
                    } else {
                        req.flash('type', 'danger');
                        req.flash('message', "Lỗi khi tạo tài khoản người dùng: ", adminResult.message);
                        return res.redirect("/login");
                    }
                } catch (error) {
                    req.flash('type', 'danger');
                    req.flash('message', "Lỗi chung: ", error.message);
                    return res.redirect("/login");
                }
            }
            else {
                req.flash('type', 'danger');
                req.flash('message', 'Tên đăng nhập hoặc mật khẩu không đúng');
                return res.redirect("/login");
            }
        }
    }
    logout(req, res, next) {
        req.logOut(function (err) {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.redirect('/');
        });
    }
    checkIsAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            res.locals.user = req.user;
            // console.log("USERINFO: "+ res.locals.user.account);
            return next();
        }
        else {
            //Trả về trang 403
            res.redirect('/Unauthenticated');
        }
    }
    //check account verify, is admin, is change password
    async checkIsAdmin(req, res, next) {
        //admin đăng nhập
        if (req.user.userEmail === 'admin@gmail.com') {
            res.redirect('/admin/home');
        } else {
            const result = await accountService.getAccountByEmail(req.user.userEmail);
            if (result.status) {
                const account = result.data;
                //Redirect tới trang đổi mật khẩu
                if (account.verified == false) {
                    req.flash('type', 'danger');
                    req.flash('message', 'Vui lòng đăng nhập bằng cách nhấp vào liên kết trong email của bạn');
                    res.redirect('/login');
                }
                //Đã đăng nhập vào link nhưng chưa đổi mật khẩu
                else if (account.changePassword === false) {
                    // req.flash('type', 'danger');
                    // req.flash('message', 'Vui lòng nhập mật khẩu mới trước');
                    //Trang đổi mật khẩu ở đây
                    res.redirect('/user/changepassword/' + req.user._id);
                }
                //User Đăng nhập thành công
                else {
                    if (account.enabled) {
                        res.redirect('/user/POS');
                    }
                    else {
                        req.flash('type', 'danger');
                        req.flash('message', 'Tải khoản của bạn đã bị khóa, liên hệ với quản trị viên để biết thêm chi tiết.');
                        res.redirect('/login');
                    }

                }
            }
        }

    }
    forgotpasswordPage(req, res, next) {
        res.render("pages/forgotpassword", { layout: null })
    }

    async forgotpassword(req, res, next) {
        if (!req.body.email) {
            req.flash('type', 'danger');
            req.flash('message', 'Vui lòng nhập email.');
            return res.redirect('/forgotpassword');
        }
        const account = await accountService.getAccountByEmail(req.body.email);
        if (account.status) {
            console.log(account.data)
            if (account.data.verified) {
                const user = await userService.getUserById(account.data.userId);
                // console.log(user.data)
                const result = await userVerificationService.sendCodeResetPassword(user.data);
                if (result.status) {
                    req.flash('type', 'success');
                    req.flash('message', 'Yêu cầu đổi mật khẩu mới đã gửi được đến <strong>' + req.body.email + '</strong>');
                    return res.redirect('/forgotpassword');
                }
                else {
                    req.flash('type', 'danger');
                    req.flash('message', 'Đã có lỗi xảy ra khi gửi email đổi mật khẩu. ' + result.message);
                    return res.redirect('/forgotpassword');
                }
            }
            else {
                req.flash('type', 'danger');
                req.flash('message', 'Vui lòng nhập xác thực tài khoản trước khi thực hiện các thao tác khác.');
                return res.redirect('/forgotpassword');
            }
        }
        else {
            req.flash('type', 'danger');
            req.flash('message',  account.message);
            return res.redirect('/forgotpassword');
        }
    }
    async changepassword(req, res, next) {
        const { userId } = req.params;
        const result = await userService.getUserById(userId);
        if (result.status) {
            const user = result.data;
            res.render("pages/changepassword", { user: user, layout: null });
        }
        else {
            req.flash('type', 'danger');
            req.flash('message', "Xác thực thất bại. Đường link đã bị thay đổi");
            res.redirect("/login");
        }
    }
    async setNewpassword(req, res, next) {
        try {
            const { userId, uniqueString } = req.params;
            const { password, cpassword } = req.body;
            if (password !== cpassword) {
                req.flash('type', 'danger');
                req.flash('message', "Mật khẩu xác nhận không chính xác.");
                return res.redirect("/changepassword/" + userId + "/" + uniqueString);
            }
            const user = await userVerificationService.getUserVerificationByUserId(userId, "ForgotPassword");
            const userVeri = user.data
            if (userVeri) {
                const { expiredAt, uniqueString: hashedUniqueString } = userVeri;
                // hết thời gian 1p
                if (expiredAt < Date.now()) {
                    userVerificationService.delUserVerification(userId)
                        // return;
                        .then((result) => {
                            if (result.status == true) {
                                req.flash('type', 'danger');
                                req.flash('message', "Đặt mật khẩu mới thất bại. Hết thời gian xác thực");
                                res.redirect("/login");
                            }
                            else {
                                req.flash('type', 'danger');
                                req.flash('message', "Đặt mật khẩu mới thất bại. " + result.message);
                                res.redirect("/login");
                            }
                        })
                        .catch((error) => {
                            req.flash('type', 'danger');
                            req.flash('message', "Đặt mật khẩu mới thất bại. " + error.message);
                            res.redirect("/login");
                        });
                    //trong thời gian 1p
                }
                else {
                    const result = await bcrypt.compare(uniqueString, hashedUniqueString);
                    if (result) {
                        //set mật khẩu mới
                        const accountExists = await accountService.getAccountByUserId(userId);
                        const account = accountExists.data;
                        if (account) {
                            //Set mật khẩu moiư
                            const hashNewPassword = bcrypt.hashSync(password, 10)
                            account.password = hashNewPassword;
                            const accountUpdated = await accountService.updatePassword(account);
                            if (accountUpdated.status) {
                                await userVerificationService.delUserVerification(userId)
                                    .then((result) => {
                                        if (result.status === true) {
                                            req.flash('type', 'success');
                                            req.flash('message', "Đặt mật khẩu mới thành công. Hãy tiến hành đăng nhập vào hệ thống");
                                            return res.redirect("/login");
                                        }
                                    })
                                    .catch((error) => {
                                        req.flash('type', 'danger');
                                        req.flash('message', "Đặt mật khẩu mới thất bại. " + error.message);
                                        res.redirect("/login");
                                    })
                            }
                            else {
                                req.flash('type', 'danger');
                                req.flash('message', "Đã có lỗi xảy ra. " + accountUpdated.message);
                                return res.redirect("/changepassword/" + userId + "/" + uniqueString);
                            }

                        }
                        else {
                            req.flash('type', 'danger');
                            req.flash('message', "Đặt mật khẩu mới thất bại. " + accountExists.message);
                            res.redirect("/login");
                        }
                    }
                    else {
                        req.flash('type', 'danger');
                        req.flash('message', "Đặt mật khẩu mới thất bại. Đường link đã bị thay đổi");
                        res.redirect("/login");
                    }
                }
            }
            else {
                req.flash('type', 'danger');
                req.flash('message', "Đặt mật khẩu mới thất bại. " + userVeri.message);
                res.redirect("/login");
            }
        } catch (error) {
            req.flash('type', 'danger');
            req.flash('message', "Đặt mật khẩu mới thất bại. " + error.message);
            res.redirect("/login");
        }
    }
    unauthenticated(req, res, next) {
        res.render("pages/error/403", { layout: null })
    }

    notfound(req, res, next) {
        res.render("pages/error/404", { layout: null })
    }
}

module.exports = new AccessController;