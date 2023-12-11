const bcrypt = require('bcrypt');
const userService = require('../services/UserService');
const accountService = require('../services/AccountService');
const userVerificationService = require('../services/UserVerificationService');
const User = require('../models/User');
const Account = require('../models/Account');

class UserAdminController {
    //Đk tài khoản nhân viên mới
    async registerNewUser(req, res, next) {
        const { username, useremail } = req.body;
        if(useremail == "" || !useremail ){
            req.flash('type', 'danger');
            req.flash('message', 'Vui lòng nhập email.');
            return res.redirect('/admin/employees');
        }
        //check xem tai khoan da dang ky chua
        const AccountExist = await accountService.getAccountByEmail(useremail);
        const AccountValue = AccountExist.data;
        if(AccountValue){
            if(AccountValue.verified) {
                req.flash('type', 'danger');
                req.flash('message', 'Tài khoản đã tồn tại.');
                return res.redirect('/admin/employees');
            }
            //Tk đã đăng ký nhưng chưa verified => kiểm tra tồn tại UserVerified hay không
            else{
                const userVerification = await userVerificationService.getUserVerificationByUserId(AccountValue.userId)
                if(userVerification.data){
                    req.flash('type', 'danger');
                    req.flash('message', 'Tài khoản đã được đăng ký. Hãy kiểm tra tài khoản email');
                    return res.redirect('/admin/employees');
                }
                //Gửi lại email verification
                else{
                    const user = await userService.getUserById(AccountValue.userId)
                    const newUser = user.data
                    await userVerificationService.sendVerificationEmail(newUser)
                        .then((result) => {
                            // Send mail thanh cong
                            if (result.status === true) {
                                req.flash('type', 'success');
                                req.flash('message', `Email xác thực đã được gửi đến ${newUser.userEmail}. Đường link sẽ hết hạn trong vòng 1 phút.`);
                            } else {
                                req.flash('type', 'danger');
                                req.flash('message', 'Lỗi khi gửi mail: ' + result.message);
                            }
                        })
                        .catch((err) => {
                            req.flash('type', 'danger');
                            req.flash('message', 'Lỗi khi gửi mail: ' + err.message);
                        })
                        .finally(() => {
                            return res.redirect('/admin/employees');
                        });
                }
            }
        }
        else{
            if(username == "" || !username ){
                req.flash('type', 'danger');
                req.flash('message', 'Vui lòng nhập tên nhân viên.');
                return res.redirect('/admin/employees');
            }
            const newUser = new User({ userEmail: useremail, fullName: username });
            userService.createUser(newUser)
                .then(async (result) => {
                    if (result.status === true) {
                        const splitEmail = newUser.userEmail.split("@");
                        const psd = splitEmail[0].trim();
                        // console.log("ACCOUNT PASSWORD CREATED: ", psd)
                        const hasedPassword = await bcrypt.hash(psd, 10);
                        const newAccount = new Account({ userId:newUser._id, userEmail: newUser.userEmail, userName: splitEmail[0], password: hasedPassword, verified: false, enabled: true, changePassword: false });
                        accountService.createAccount(newAccount)
                            .then(async (result) => {
                                if (result.status === true) {
                                    // Send mail
                                    await userVerificationService.sendVerificationEmail(newUser)
                                        .then((result) => {
                                            // Send mail thanh cong
                                            if (result.status === true) {
                                                req.flash('type', 'success');
                                                req.flash('message', `Email xác thực đã được gửi đến ${newUser.userEmail}. Đường link sẽ hết hạn trong vòng 1 phút.`);
                                            } else {
                                                req.flash('type', 'danger');
                                                req.flash('message', 'Lỗi khi gửi mail: ' + result.message);
                                            }
                                        })
                                        .catch((err) => {
                                            req.flash('type', 'danger');
                                            req.flash('message', 'Lỗi khi gửi mail: ' + err.message);
                                        })
                                        .finally(() => {
                                            return res.redirect('/admin/employees');
                                        });
                                }
                            })
                            .catch((err) => {
                                req.flash('type', 'danger');
                                req.flash('message', 'Lỗi khi tạo tài khoản: ' + err.message);
                                return res.redirect('/admin/employees');
                            })
    
                    } else {
                        req.flash('type', 'danger');
                        req.flash('message', 'Lỗi khi tạo người dùng: ' + result.message);
                        // console.error();
                        return res.redirect('/admin/employees');
                    }
                })
                .catch((err) => {
                    req.flash('type', 'danger');
                    req.flash('message', 'Lỗi khi tạo người dùng: ' + err.message);
                    return res.redirect('/admin/employees');
                });
        }
    }
    async lockAccount(req, res) {
        const userId = req.body.userId;
        const accountExists = await accountService.getAccountByUserId(userId);
        if(accountExists.status){
            const account = accountExists.data;
            account.enabled = false;
            const updatedAccount = await accountService.updateAccount(account);
            if(updatedAccount.status){
                req.flash('type', 'success');
                req.flash('message', 'Khóa tài khoản <strong> '+ updatedAccount.data.userEmail +'</strong> thành công.');
                return res.redirect('/admin/employees');
            }
            req.flash('type', 'danger');
            req.flash('message', 'Đã có lỗi xảy ra: ' + updatedAccount.message);
            return res.redirect('/admin/employees');
        }
        req.flash('type', 'danger');
        req.flash('message', 'Đã có lỗi xảy ra: ' + accountExists.message);
        return res.redirect('/admin/employees');
    }

    async unlockAccount(req, res) {
        const userId = req.body.userId;
        const accountExists = await accountService.getAccountByUserId(userId);
        if(accountExists.status){
            const account = accountExists.data;
            account.enabled = true;
            const updatedAccount = await accountService.updateAccount(account);
            if(updatedAccount.status){
                req.flash('type', 'success');
                req.flash('message', 'Mở khóa tài khoản <strong> '+ updatedAccount.data.userEmail +'</strong> thành công.');
                return res.redirect('/admin/employees');
            }
            req.flash('type', 'danger');
            req.flash('message', 'Đã có lỗi xảy ra: ' + updatedAccount.message);
            return res.redirect('/admin/employees');
        }
        req.flash('type', 'danger');
        req.flash('message', 'Đã có lỗi xảy ra: ' + accountExists.message);
        return res.redirect('/admin/employees');
    }

    async filterEmployees(req, res){
        const {name, status} = req.body;
        // console.log(name, status);
        const filterObject = {};
        const StatusObject = {};
        if (name) {
            filterObject.fullName = { $regex: new RegExp(name, 'i') };
        }
        //3 đk (verified, changepsd, enable)
        if (status) {
            if(status == "inactive"){
                StatusObject.verified = false
            }
            else{
                StatusObject.verified = true;
            } 
        }
        const employeesList = await userService.getUsersByFilter(filterObject);
        let employeesResults = [];
        if(employeesList.status){
            for (const element of employeesList.data) {
                if (element.userEmail !== "admin@gmail.com") {
                    const account = await accountService.getAccountByEmail(element.userEmail);
                    const newEmployeeData = {
                        user: element,
                        account: account.data
                    }
                    if(status){
                        if(account.data.verified === StatusObject.verified){
                            employeesResults.push(newEmployeeData);
                        }
                    }
                    else{
                        employeesResults.push(newEmployeeData);
                    }
                }
            }
        }
        res.status(200).json(employeesResults); 
    }

}

module.exports = new UserAdminController;
