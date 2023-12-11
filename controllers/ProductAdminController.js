const productService = require('../services/ProductService');
const Product = require('../models/Product');
const invoiceDetailService = require('../services/InvoiceDetailService');
const merchandiseService = require('../services/MerchandiseService');
const { formatTimeInVietnamTimeZone } = require('../utils/convertToVNTimeZone');

class ProductAdminController {

    async addNewProduct(req, res, next) {
        const {productName, category, manufacturer, description}  = req.body;
        const newProduct = new Product({productName: productName, category: category, manufacturer: manufacturer, description: description})
        await productService.createProduct(newProduct)
        .then((result)=>{
            if(result.status === true){
                req.flash('type', 'success');
                req.flash('message', 'Thêm sản phẩm mới thành công');
                return res.redirect("/admin/products");
            }
            else{
                req.flash('type', 'danger');
                req.flash('message', 'Thêm sản phẩm mới thất bại' + result.message);
                return res.redirect("/admin/products");
            }
        })
        .catch((error) => {
            req.flash('type', 'danger');
            req.flash('message', 'Thêm sản phẩm mới thất bại. ' + error.message);
            return res.redirect("/admin/products");
        })
    }
    //for inner modal
    async addNewProductInner(req, res, next) {
        const { productName, category, manufacturer, description } = req.body;
        const newProduct = new Product({ productName: productName, category: category, manufacturer: manufacturer, description: description })
        await productService.createProduct(newProduct)
            .then((result) => {
                if (result.status === true) {
                    req.flash('innerAdd', 'true');
                    req.flash('type', 'success');
                    req.flash('message', 'Thêm sản phẩm mới thành công');
                    req.flash('productId', result.data._id);
                    req.flash('productName', result.data.productName);
                    // res.render("pages/admin/merchandises", {isAdmin: true, newProduct: result.data});
                    return res.redirect("/admin/products");
                }
                else {
                    req.flash('type', 'danger');
                    req.flash('message', 'Thêm sản phẩm mới thất bại' + result.message);
                    return res.redirect("/admin/products");
                }
            })
            .catch((error) => {
                req.flash('type', 'danger');
                req.flash('message', 'Thêm sản phẩm mới thất bại. ' + error.message);
                return res.redirect("/admin/products");
            })
    }
    async deleteProduct(req, res, next) {
        const productId = req.body.productId;
        //check xem co nam trong invoice chua
        // const productAlreadySold = invoiceDetailService.getInvoiceDetailBy
        //Get tất cả hàng hóa
        const merchandisesData = await merchandiseService.getAllMerchandisesByProductId(productId);
        if(merchandisesData.status){
            const merchandises = merchandisesData.data;
            for(const merchandise of merchandises){
                const productAlreadySold = await invoiceDetailService.getInvoiceDetailByMerchandiseId(merchandise._id);
                if(productAlreadySold.status){
                    req.flash('type', 'danger');
                    req.flash('message', 'Không thể xóa sản phẩm đã được bán ra.');
                    return res.redirect("/admin/products",);
                }
            }
        }
        await productService.deleteProduct(productId)
        .then((result)=>{
            if(result.status === true){
                req.flash('type', 'success');
                req.flash('message', 'Xóa sản phẩm <strong>' + result.data.productName + '</strong> thành công');
                return res.redirect("/admin/products",);
            }
            else{
                req.flash('type', 'danger');
                req.flash('message', 'Xóa sản phẩm thất bại. ' + result.message);
                return res.redirect("/admin/products",);
            }
        })
        .catch((error) => {
            req.flash('type', 'danger');
            req.flash('message', 'Xóa sản phẩm thất bại. ' + error.message);
            return res.redirect("/admin/products",);
        })
    }
    async updateProduct(req, res, next){
        const {productId, productName, category, description} = req.body;
        const productData = await productService.getProductById(productId);
        if(productData.status){
            const product = productData.data;
            product.description = description;
            product.productName = productName;
            product.category = category;
            const result = await productService.updateProduct(product);
            if(result.status){
                req.flash('type', 'success');
                req.flash('message', 'Sửa sản phẩm thành công. ');
                return res.redirect("/admin/products/" + productId);
            }
            else{
                req.flash('type', 'success');
                req.flash('message', 'Sửa sản phẩm thất bại. ' +  result.message);
                return res.redirect("/admin/products/" + productId);
            }
        }
        else{
            req.flash('type', 'success');
            req.flash('message', 'Sửa sản phẩm thất bại. ' +  result.message);
            return res.redirect("/admin/products/" + productId);
        }
    }

    async getAllProducts(req, res, next) {
        const products = await productService.getAllProducts()
        res.json(products.data);
    }//api

    //api get products by filtering
    async filterProducts(req, res, next) {
        const {name, price, status, category, dateImport} = req.body;
        const filterObject = {};
        const filterPrice = {};
        if (name) {
            filterObject.productName = { $regex: new RegExp(name, 'i') };
        }

        if (price) {
            if(price.substr(0, 2) == "lt"){
                const filterprice = price.substr(2, price.length);
                filterPrice.retailPrice = { $lt: parseInt(filterprice)};
            }
            else{
                const filterprice = price.substr(2, price.length);
                filterPrice.retailPrice = { $gt: parseInt(filterprice)};
            }
        }

        if (category) {
            filterObject.category = { $regex: new RegExp(category, 'i') };
        }
        if (dateImport) {
            const startDate = new Date(dateImport);
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1);
            filterObject.createdAt = {$gte: startDate.toISOString(),$lt: endDate.toISOString()};
        }
        const products = await productService.getProductsByFilter(filterObject)
        let productsResult = [];
        if (products.status){
            for (const product of products.data) {
                const merchandise = await merchandiseService.getOneMerchandiseByProductIdFilterPrice(product._id, filterPrice.retailPrice);
                if(merchandise.status){
                    product.merchandise = merchandise.data;
                    product.createdAt = formatTimeInVietnamTimeZone(product.createdAt);
                    if(status!=""){
                        const quantity = await productService.getAllQuantityOfProduct(product._id);
                        console.log(quantity)
                        if(status == "stocking"){
                            if(quantity.status){
                                if(quantity.data > 0){
                                    productsResult.push(product);
                                }
                            }
                        }else{
                            if(quantity.status){
                                if(quantity.data == 0){
                                    productsResult.push(product);
                                }
                            }
                        }
                    }
                    else{
                        productsResult.push(product);
                    }
                }
                else{
                    console.log(filterObject)
                    if(Object.keys(filterObject).length == 0 && Object.keys(filterPrice).length == 0){
                        product.merchandise = null;
                        product.createdAt = formatTimeInVietnamTimeZone(product.createdAt);
                        productsResult.push(product);
                    }
                }
            }
        
        }
        res.status(200).json(productsResult); 
    }
}

module.exports = new ProductAdminController;
