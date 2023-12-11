const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController")
const adminController = require("../controllers/AdminController")
const accessController = require("../controllers/AccessController")
const momoPaymentController = require("../controllers/MomoPaymentController");
const invoiceController = require("../controllers/InvoiceController")
const merchandiseAdminController = require("../controllers/MerchandiseAdminController");
const customerController = require("../controllers/CustomerController");
const productAdminController = require("../controllers/ProductAdminController")
const { body, validationResult } = require('express-validator')

// USER_POS PAGE
router.get("/POS", userController.index);


// USER/CUSTOMEREINFORMATION
router.get("/customers", userController.listCustomer);

router.post("/api/customers", customerController.filterCustomers);
// USER/ABOUTCUSTOMER
router.get("/aboutcustomer/:customerId", userController.aboutCustomer);

// USER/LISTPRODUCTS
// ADMIN_PRODUCTS
router.get("/products/:productId", userController.listProductsById);

// ADMIN_PRODUCTS
router.get("/products", userController.listProducts);

router.post("/api/products", productAdminController.filterProducts); //api

// ADMIN_ABOUT_PRODUCT
router.get("/products/aboutproduct/:merchandiseId", userController.aboutProduct);

router.post("/api/merchandises", merchandiseAdminController.filterMerchandises);

router.get("/api/merchandises/getAllMerchandises", merchandiseAdminController.getAllMerchandises); //api

router.get("/api/customers/getAllCustomers", customerController.getAllCustomers); //api

router.post("/api/customers/addNewCustomer", customerController.addNewCustomer); //api

router.get("/statistic", userController.statisticPage);
router.get("/api/statistic", adminController.listStatisticInvoices);
router.post("/api/statistic", adminController.filterStatistic);

router.get("/profile", accessController.checkIsAuthenticated, userController.profile);

router.post("/profile/profileUpdateInfo", userController.updateUserProfile);

router.post("/profile/profileUpdateAvt", userController.profileUpdateAvt);

router.post('/profile/changepassword', [
    body('currentpassword')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập mật khẩu hiện tại'),
    body('newpassword')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập mật khẩu mới'),
    body('cpassword')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập mật khẩu xác nhận')
], (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        let messages = '';
        errors.array().forEach(element => {
            messages = messages + element.msg + ". <br> ";
        });
        req.flash('type', 'danger');
        req.flash('message', messages);
        return res.redirect('/user/profile');
    }
    else {
        next();
    }
}, userController.changePassword);


router.get('/getInvoice/:invoiceId', userController.invoiceDetail)

router.post("/addInvoice", invoiceController.addNewInvoice)

//verified user
router.get('/verify/:userId/:uniqueString', userController.verifyUser);

router.get('/changepassword/:userID', userController.changePasswordPage);

router.post('/changepassword/:userID', userController.changePasswordFisrtly);


//MOMO-PAYMENT
router.get("/momo-payment/:invoiceId/:total", momoPaymentController.paymentWithMomo);

// router.post("/momo-callback", momoPaymentController.momoCallBack);

router.get("/getResultTransaction", momoPaymentController.getResultTransaction);

module.exports = router;
