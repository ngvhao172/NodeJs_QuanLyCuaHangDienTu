const express = require("express");
const router = express.Router();
const userAdminController = require("../controllers/UserAdminController")
const adminController = require("../controllers/AdminController")
const productAdminController = require("../controllers/ProductAdminController")
const accessController = require("../controllers/AccessController");
const merchandiseAdminController = require("../controllers/MerchandiseAdminController");
const customerController = require("../controllers/CustomerController");
const { body, validationResult } = require('express-validator')
const userController = require('../controllers/UserController');




// ADMIN_HOME PAGE
router.get("/home", adminController.index);

// ADMIN_LIST_EMPLOYEE PAGE
router.get("/employees", adminController.listEmployees);

router.post("/employees", userAdminController.registerNewUser);

router.post("/api/employees", userAdminController.filterEmployees); //api

// ADMIN_ABOUT_EMPLOYEE PAGE

router.get("/employees/aboutemployee/:employeeId", adminController.aboutEmployee);

// ADMIN_LIST_CUSTOMER PAGE
router.get("/customers", adminController.listCustomer);//api

router.post("/api/customers", customerController.filterCustomers);

// ADMIN_ABOUT_CUSTOMER PAGE
router.get("/aboutcustomer/:customerId", adminController.aboutCustomer);

// ADMIN_PRODUCTS PAGE
router.get("/products/:productId", adminController.listProductsById);

// ADMIN_PRODUCTS PAGE
router.get("/products", adminController.listProducts);

router.post("/products", [
    body('productName')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập tên sản phẩm'),
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập phân loại'),
    body('manufacturer')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập nhà sản xuất')
], (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        let messages = '';
        errors.array().forEach(element => {
            messages = messages + element.msg + ". <br> ";
        });
        req.flash('type', 'danger');
        req.flash('message', messages);
        return res.redirect('/admin/products')
    }
    else {
        next();
    }
}, productAdminController.addNewProduct);

router.post("/products/addProductInner", [
    body('productName')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập tên sản phẩm'),
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập phân loại'),
    body('manufacturer')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập nhà sản xuất')
], (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        let messages = '';
        errors.array().forEach(element => {
            messages = messages + element.msg + ". <br> ";
        });
        req.flash('type', 'danger');
        req.flash('message', messages);
        return res.redirect('/admin/products')
    }
    else {
        next();
    }
}, productAdminController.addNewProductInner);

router.post("/products/deleteProduct", productAdminController.deleteProduct);

router.get("/api/products/getAllProducts", productAdminController.getAllProducts); //api

router.get("/api/merchandises/getAllMerchandises", merchandiseAdminController.getAllMerchandises); //api

router.get("/api/customers/getAllCustomers", customerController.getAllCustomers); //api

router.post("/api/customers/addNewCustomer", customerController.addNewCustomer); //api

// ADMIN_STATISTICS
router.get("/statistic", adminController.listStatistic);
router.get("/api/statistic", adminController.listStatisticInvoices);
router.post("/api/statistic", adminController.filterStatistic);

// ADMIN_ABOUT_PRODUCT PAGE
router.get("/products/aboutproduct/:merchandiseId", adminController.aboutProduct);

//
router.post("/api/products", productAdminController.filterProducts);


// ADMIN_MERCHANDISES PAGE
router.get("/merchandises", adminController.listMerchandises);

router.post("/products/:productId", merchandiseAdminController.addNewMerchandise);

router.delete("/products/:productId", merchandiseAdminController.deleteMerchandise);

router.post("/products/productDetail/updateProduct", productAdminController.updateProduct);

router.post("/products/aboutproduct/:merchandiseId", merchandiseAdminController.updateMerchandise)


router.post("/api/merchandises", merchandiseAdminController.filterMerchandises);

//inner create product
router.post("/merchandises/addNewProductInner", [
    body('productName')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập tên sản phẩm'),
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập phân loại'),
    body('manufacturer')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập nhà sản xuất')
], (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        let messages = '';
        errors.array().forEach(element => {
            messages = messages + element.msg + ". <br> ";
        });
        req.flash('type', 'danger');
        req.flash('message', messages);
        return res.redirect('/admin/mechandises')
    }
    else {
        next();
    }
}, merchandiseAdminController.addNewProduct);


// ADMIN_PROFILE
router.get("/profile", accessController.checkIsAuthenticated, adminController.profile);


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
        return res.redirect('/admin/profile');
    }
    else {
        next();
    }
}, userController.changePassword);

router.post("/userAccount/lock", userAdminController.lockAccount)

router.post("/userAccount/unlock", userAdminController.unlockAccount)




module.exports = router;
