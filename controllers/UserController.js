const bcrypt = require('bcrypt');
const userVerification = require('../services/UserVerificationService');
const accountService = require('../services/AccountService');
const productService = require('../services/ProductService');
const userService = require('../services/UserService');
const merchandiseService = require('../services/MerchandiseService');
const invoiceService = require('../services/InvoiceService');
const customerService = require('../services/CustomerService');
const invoiceDetailService = require('../services/InvoiceDetailService');
const { formatTimeInVietnamTimeZone } = require('../utils/convertToVNTimeZone');
const multiparty = require('multiparty');
const pathData = require('path');
const fs = require('fs');

class UserController {

    async index(req, res, next){
        const merchandiseList = await merchandiseService.getAllMerchandises();
        if(!merchandiseList.status){
            req.flash('type', 'danger');
            req.flash('message', "Đã có lỗi xảy ra." + merchandiseList.status);
            return res.render("pages/user/POS");
        }
        else{
            const merchandises = merchandiseList.data;
            let merchandisesResult = [];
            for (const merchandise of merchandises) {
                //mặt hàng có số lượng lớn hơn 0
                if(merchandise.quantity>0){
                    const product = await productService.getProductById(merchandise.productId);
                    merchandise.product = product.data;
                    merchandisesResult.push(merchandise);
                }
            }
            res.render("pages/user/POS", {merchandises: merchandisesResult});
        }
    }
    async profile(req, res, next) {
        const accountData = await accountService.getAccountByEmail(req.user.userEmail);
        res.render("pages/user/info", { userAccount: accountData.data });
    }

    async listProducts(req, res, next) {
        const productsList = await productService.getAllProducts();
        let productsResult = [];
        for (const product of productsList.data) {
            const merchandise = await merchandiseService.getOneMerchandiseByProductId(product._id);
            product.merchandise = merchandise.data;
            product.createdAt = formatTimeInVietnamTimeZone(product.createdAt);
            productsResult.push(product);
        }
        res.render("pages/user/listproduct", { products: productsResult });
    }

    async statisticPage(req, res, next){
        res.render("pages/user/statistic")
    }

    async listProductsById(req, res, next) {
        const productId = req.params.productId;
        const merchandisesList = await merchandiseService.getAllMerchandisesByProductId(productId);
        let merchandisesResults = [];
        const product = await productService.getProductById(productId);
        for (const merchandise of merchandisesList.data) {
            merchandise.createdAt = formatTimeInVietnamTimeZone(merchandise.createdAt);
            merchandise.product = product.data;
            merchandisesResults.push(merchandise);
        }
        res.render("pages/user/listmerchandise", { merchandises: merchandisesResults, product: product.data });
    }
    async aboutProduct(req, res, next) {
        const merchandiseId = req.params.merchandiseId;
        // console.log(merchandiseId)
        const result = await merchandiseService.getMerchandiseById(merchandiseId);
        // console.log(result);
        if (result.status) {
            const merchandise = result.data;
            const productResult = await productService.getProductById(merchandise.productId)
            if (productResult.status) {
                merchandise.product = productResult.data;
            }
            return res.render("pages/user/aboutproduct", { merchandise: merchandise });
        }
        return res.redirect("/notfound")
    }


    async updateUserProfile(req, res, next) {
        const { fullName, userEmail, address, dob, phoneNumber, gender } = req.body;
        let redirectLink = "";
        if (userEmail == "admin@gmail.com") {
            redirectLink = "/admin/profile";
        }
        else {
            redirectLink = "/user/profile";
        }
        const result = await userService.getUserByEmail(userEmail);
        if (result.status == true) {
            const User = result.data;
            User.fullName = fullName;
            User.address = address;
            User.dob = dob;
            User.phoneNumber = phoneNumber;
            User.gender = gender;

            const updatedUser = await userService.updateUser(User);
            if (updatedUser.status) {
                req.flash('type', 'success');
                req.flash('message', "Thay đổi thông tin cá nhân thành công");
                return res.redirect(redirectLink);
            }
            else {
                req.flash('type', 'danger');
                req.flash('message', "Đã có lỗi xảy ra. " + updatedUser.message);
                return res.redirect(redirectLink);
            }
        }
        else {
            req.flash('type', 'danger');
            req.flash('message', "Đã có lỗi xảy ra. " + result.message);
            return res.redirect(redirectLink);
        }
    }
    async profileUpdateAvt(req, res, next) {
        let redirectLink = "";
        const form = new multiparty.Form()
        form.parse(req, async (err, fields, files) => {
            const anthenEmail = fields.userEmail;
            if (anthenEmail == "admin@gmail.com") {
                redirectLink = "/admin/profile";
            }
            else {
                redirectLink = "/user/profile";
            }
            let filesExist = [];
            try {
                filesExist = await fs.promises.readdir('public/avatars');
            } catch (err) {
                req.flash('type', 'danger');
                req.flash('message', "Lỗi khi đổi avatar. " + err.message);
                return res.redirect(redirectLink);
            }
            if (err) {
                req.flash('type', 'danger');
                req.flash('message', "Lỗi khi đổi avatar. " + err.message);
                return res.redirect(redirectLink);
            }
            // console.log(files)
            files.image.forEach(file => {
                var oldPath = file.path;
                var parts = file.originalFilename.match(/(.*)(\.[^.]+)$/);
                var ext = parts[2];
                var newfilename = parts[1] + ext;
                var imgext = ['.png', '.jpg', '.jpeg'];
                if (imgext.findIndex(s => s = ext) > -1) {
                    if (filesExist.indexOf(newfilename) > -1) {
                        newfilename = parts[1] + '_' + Math.random(10000) + ext;
                    }
                    var newPath = pathData.join(__dirname, '../public/avatars', newfilename);

                    fs.copyFile(oldPath, newPath, async (err) => {
                        if (err) {
                            req.flash('type', 'danger');
                            req.flash('message', "Lỗi khi đổi avatar. " + err.message);
                            return res.redirect(redirectLink);
                        }
                        const userEmail = fields.userEmail;
                        const result = await userService.getUserByEmail(userEmail);
                        if (result.status == true) {
                            const avataPath = '/avatars/' + newfilename;
                            const User = result.data;
                            User.avatar = avataPath;
                            await userService.updateUser(User);
                            req.flash('type', 'success');
                            req.flash('message', "Đổi avatar thành công.");
                            res.redirect(redirectLink);
                        }
                        else {
                            req.flash('type', 'danger');
                            req.flash('message', "Không tìm thấy người dùng");
                            res.redirect(redirectLink);
                        }
                    });
                }

            })
        })
    }

    async verifyUser(req, res, next) {
        try {
            const { userId, uniqueString } = req.params;
            const user = await userVerification.getUserVerificationByUserId(userId, "Verification");
            const userVeri = user.data
            if (userVeri) {
                const { expiredAt, uniqueString: hashedUniqueString } = userVeri;
                // hết thời gian 1p
                if (expiredAt < Date.now()) {
                    userVerification.delUserVerification(userId)
                        // return;
                        .then((result) => {
                            if (result.status == true) {
                                req.flash('type', 'danger');
                                req.flash('message', "Xác thực thất bại. Hết thời gian xác thực. Hãy liên hệ với quản trị viên để cấp đường link mới");
                                res.redirect("/login");
                            }
                            else {
                                req.flash('type', 'danger');
                                req.flash('message', "Xác thực thất bại. Hết thời gian xác thực. Hãy liên hệ với quản trị viên để cấp đường link mới");
                                res.redirect("/login");
                            }
                        })
                        .catch((error) => {
                            req.flash('type', 'danger');
                            req.flash('message', "Xác thực thất bại. " + error.message);
                            res.redirect("/login");
                        });
                    //trong thời gian 1p
                } else {
                    const result = await bcrypt.compare(uniqueString, hashedUniqueString);
                    if (result) {
                        const accountUpdated = await accountService.updateAccountStatus(userId);
                        if (accountUpdated) {
                            await userVerification.delUserVerification(userId)
                                .then((result) => {
                                    if (result.status === true) {
                                        req.flash('type', 'success');
                                        req.flash('message', "Xác thực thành công. Hãy đổi mật khẩu mới để truy cập vào hệ thống.");
                                        return res.redirect("/user/changepassword/" + userId);
                                    }
                                })
                                .catch((error) => {
                                    req.flash('type', 'danger');
                                    req.flash('message', "Xác thực thất bại. " + error.message);
                                    res.redirect("/login");
                                })
                        }
                        else {
                            req.flash('type', 'danger');
                            req.flash('message', "Xác thực thất bại. Không thể cập nhật trạng thái tài khoản");
                            res.redirect("/login");
                        }
                    }
                    else {
                        req.flash('type', 'danger');
                        req.flash('message', "Xác thực thất bại. Đường link đã bị thay đổi");
                        res.redirect("/login");
                    }
                }
            }
            else {
                req.flash('type', 'danger');
                req.flash('message', "Xác thực thất bại. Không tìm thấy xác thực người dùng");
                res.redirect("/login");
            }
        } catch (error) {
            req.flash('type', 'danger');
            req.flash('message', "Xác thực thất bại. " + error.message);
            res.redirect("/login");
        }
    }
    async changePasswordPage(req, res, next) {
        const { userID } = req.params;
        const result = await userService.getUserById(userID);
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
    async changePasswordFisrtly(req, res, next) {
        const { password, cpassword } = req.body;
        const userId = req.params.userID;
        if(!password || !cpassword) {
            req.flash('type', 'danger');
            req.flash('message', "Mật khẩu không được để trống");
            return res.redirect("" + userId);
        }
        if (cpassword === password) {
            const result = await accountService.getAccountByUserId(userId);
            if (result.status) {
                const account = result.data;
                if(bcrypt.compareSync(password, account.password)){
                    req.flash('type', 'danger');
                    req.flash('message', "Mật khẩu mới không được trùng với mật khẩu cũ.");
                    return res.redirect("" + userId);
                }
                const hasedPassword = await bcrypt.hash(password, 10);
                account.password = hasedPassword;
                account.changePassword = true;
                // console.log(account)
                const accountResult = await accountService.updatePassword(account);

                if (accountResult.status) {
                    req.flash('type', 'success');
                    req.flash('message', "Đổi mật khẩu thành công");
                    //login
                    return res.redirect('/login');
                }
                else {
                    req.flash('type', 'danger');
                    req.flash('message', "Đổi mật khẩu thất bại. " + accountResult.message);
                    return res.redirect('/login');
                }
            }
            else {
                req.flash('type', 'danger');
                req.flash('message', "Đổi mật khẩu thất bại. " + result.message);
                return res.redirect('/login');
            }
        }
        else {
            req.flash('type', 'danger');
            req.flash('message', "Mật khẩu xác nhận không trùng khớp.");
            return res.redirect("" + userId);
        }
    }
    async changePassword(req, res, next) {
        const { currentpassword, newpassword, cpassword, userId, userEmail } = req.body;
        let redirectLink = "";
        if (userEmail == "admin@gmail.com") {
            redirectLink = "/admin/profile";
        }
        else {
            redirectLink = "/user/profile";
        }
        if(!currentpassword || !cpassword || !cpassword) {
            req.flash('type', 'danger');
            req.flash('message', "Mật khẩu không được để trống");
            return res.redirect(redirectLink);
        }
        if (newpassword === cpassword) {
            const result = await accountService.getAccountByUserId(userId);
            if (result.status) {
                const account = result.data;
                if (!(await bcrypt.compare(currentpassword, account.password))) {
                    req.flash('type', 'danger');
                    req.flash('message', "Mật khẩu hiện tại không chính xác");
                    return res.redirect(redirectLink);
                }
                if(bcrypt.compareSync(newpassword, account.password)){
                    req.flash('type', 'danger');
                    req.flash('message', "Mật khẩu mới không được trùng với mật khẩu cũ.");
                    return res.redirect(redirectLink);
                }
                const hasedPassword = await bcrypt.hash(newpassword, 10);
                account.password = hasedPassword;
                account.changePassword = true;
                // console.log(account)
                const accountResult = await accountService.updatePassword(account);

                if (accountResult.status) {
                    req.flash('type', 'success');
                    req.flash('message', "Đổi mật khẩu thành công");
                    return res.redirect(redirectLink);
                }
                else {
                    req.flash('type', 'danger');
                    req.flash('message', "Đổi mật khẩu thất bại. " + accountResult.message);
                    return res.redirect(redirectLink);
                }
            }
            else {
                req.flash('type', 'danger');
                req.flash('message', "Đổi mật khẩu thất bại. " + result.message);
                return res.redirect(redirectLink);
            }
        }
        else {
            req.flash('type', 'danger');
            req.flash('message', "Mật khẩu xác nhận không trùng khớp.");
            return res.redirect(redirectLink);
        }
    }    
    async invoiceDetail(req, res, next){
        const invoiceId = req.params.invoiceId;
        const invoiceData = await invoiceService.getInvoiceById(invoiceId);
        if(invoiceData.status){
            const invoiceDetails = [];
            const invoice = invoiceData.data;
            const invoiceDetailsData = await invoiceDetailService.getInvoicesDetailByInvoiceId(invoice._id);
            if(invoiceDetailsData.status){
                for(const invoiceDetail of invoiceDetailsData.data){
                    const merchandisetData = await merchandiseService.getMerchandiseById(invoiceDetail.merchandiseId);
                    if(merchandisetData.status){
                        const merchandise = merchandisetData.data;
                        invoiceDetail.color = merchandise.color;
                        invoiceDetail.storage = merchandise.storage;
                        invoiceDetail.productPrice = merchandise.retailPrice;
                        const productData = await productService.getProductById(merchandise.productId);
                        if(productData.status){
                            const product = productData.data;
                            invoiceDetail.productName = product.productName;
                        }
                    }
                    invoiceDetails.push(invoiceDetail);
                }
                invoice.invoiceDetails = invoiceDetails;
            }
            const customerData = await customerService.getCustomerById(invoice.customerId);
            if(customerData.status){
                const customer = customerData.data;
                invoice.customer = customer;
            }
            const employeeData = await userService.getUserById(invoice.employeeId);
            if(employeeData.status){
                const employee = employeeData.data;
                invoice.employee = employee;
            }
            // console.log(invoice);
            res.render("pages/user/invoice", {invoice: invoice})
        }
    }
    async aboutCustomer(req, res, next) {
        const customerId = req.params.customerId;
        // console.log(merchandiseId)
        const result = await customerService.getCustomerById(customerId);
        // console.log(result);
        if(result.status){
            const customer = result.data;
            let totalInvoice = 0;
            let totalAmount = 0;
            let totalDiscount = 0;
            let totalPaid = 0;
            const invoicesData = await invoiceService.getAllInvoicesByCustomerId(customer._id);
            if(invoicesData.status){
                totalInvoice = invoicesData.data.length;
                // let invoiceDetailsList = [];
                for(const invoice of invoicesData.data){
                    totalAmount += parseInt(invoice.totalAmount);
                    totalDiscount += parseInt(invoice.discount);
                    totalPaid += parseInt(invoice.totalAfterDiscount);
                    const invoiceDetails = await invoiceDetailService.getAllInvoiceDetailByInvoiceId(invoice._id);
                    if(invoiceDetails.status){
                        invoice.invoiceDetails = invoiceDetails.data;
                        let totalProduct = 0;
                        for(const invoiceDetail of invoiceDetails.data){
                            invoiceDetail.totalProduct = totalProduct
                            totalProduct += parseInt(invoiceDetail.quantity)
                            // console.log(invoiceDetail);
                            // const productData = await productService.getProductById(invoiceDetail.productId);
                            const merchandiseData = await merchandiseService.getMerchandiseById(invoiceDetail.merchandiseId);
                            if(merchandiseData.status){
                                const productData = await productService.getProductById(merchandiseData.data.productId);
                                if(productData.status){
                                    const merchandise = merchandiseData.data;
                                    merchandise.productName = productData.data.productName;
                                    invoiceDetail.product = merchandise;
                                }
                            }
                            // console.log(invoiceDetail)
                        }
                    }
                    const employeeData = await userService.getUserById(invoice.employeeId);
                    if(employeeData.status){
                        invoice.employee = employeeData.data;
                    }
                }
                customer.invoicesList = invoicesData.data; 
                customer.totalInvoice = totalInvoice
                customer.totalAmount = totalAmount
                customer.totalDiscount = totalDiscount
                customer.totalPaid = totalPaid
            }
            // console.log(customer)
            return res.render("pages/user/aboutcustomer", {customer: customer });
        }
        return res.redirect("/notfound")
    }
    async listCustomer(req, res, next) {
        const customerList = await customerService.getAllCustomers();
        let customersResults = [];
        for (const customer of customerList.data) {
            const lastInvoice = await invoiceService.getRecentlyInvoice(customer._id);
            if(lastInvoice.status){
                customer.recentlyInvoice = lastInvoice.data;
            }
            customersResults.push(customer);
        }
        customersResults.length = customerList.data.length;
        res.render("pages/user/listcustomer", { customers: customersResults })
    }
}
module.exports = new UserController;
