const productService = require('../services/ProductService');
const merchandiseService = require('../services/MerchandiseService');
const Merchandise = require('../models/Merchandise');
const Product = require('../models/Product');
const multiparty = require('multiparty');
const pathData = require('path');
const bwipjs = require('bwip-js');
const fs = require('fs');
const invoiceDetailService = require('../services/InvoiceDetailService');
const { formatTimeInVietnamTimeZone } = require('../utils/convertToVNTimeZone');


class MerchandiseAdminController {

    //for inner modal
    async addNewProduct(req, res, next) {
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
                    return res.redirect("/admin/products/" +  result.data._id);
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
    async addNewMerchandise(req, res, next){
        const productIdValue  = req.params.productId;
        if(productIdValue!=null){
            const productExists = await productService.getProductById(productIdValue);
            if(!productExists.status){
                return res.redirect("/admin/products")
            }
        }
        let filesExist = [];
        try {
            filesExist = await fs.promises.readdir('public/productImages');
        } catch (err) {
            req.flash('type', 'danger');
            req.flash('message', "Lỗi khi fetch ảnh. " + err.message);
            return res.redirect("/admin/products/" +  productIdValue);
        }
        const form = new multiparty.Form()
        form.parse(req, async (err, fields, files) => {
            // console.log(fields)
            if (err){
                req.flash('type', 'danger');
                req.flash('message', "Lỗi khi thêm ảnh hàng hóa. " + err.message);
                return res.redirect("/admin/products/" +  productIdValue);
            }
            //Tìm xem tồn tại sản phẩm hay không
            //Các trường thông tin khác
            const productId = fields.productId[0];
            const productName = fields.productName[0];
            const quantity = fields.quantity[0];
            const color = fields.color[0];
            const importPrice = fields.importPrice[0];
            const retailPrice = fields.retailPrice[0];
            const storage = fields.storage[0];
            const errors = [];

            if (!productId) {
                errors.push("Vui lòng nhập ID sản phẩm.");
            }
            if (!productName) {
                errors.push("Vui lòng nhập tên sản phẩm.");
            }
    
            if (!quantity || quantity < 0) {
                errors.push("Vui lòng nhập số lượng lớn hơn hoặc bằng 0.");
            }
    
            if (!color) {
                errors.push("Vui lòng nhập màu sắc.");
            }
    
            if (!importPrice || importPrice < 0) {
                errors.push("Vui lòng nhập giá nhập lớn hơn 0.");
            }
            if (!retailPrice || retailPrice < 0) {
                errors.push("Vui lòng nhập giá bán lớn hơn 0.");
            }
            if (!files.image[0].originalFilename || files.image[0].originalFilename == "") {
                errors.push("Vui lòng thêm ảnh sản phẩm.");
            }
            if (errors.length > 0) {
                req.flash('type', 'danger');
                let messages = "";
                for (const error of errors) {
                    messages = messages + error + " <br> ";
                }
                req.flash('message',  messages);
                return res.redirect("/admin/products/" +  productIdValue);
            }
            // console.log("ID = ", fields.productId[0]);
            const productExists = await productService.getProductById(fields.productId[0]);
            if(productExists.status == true){
                // console.log(files)
                const imagePaths = []
                for (let i = 0; i < files.image.length; i++) {
                    const file = files.image[i];
                    const oldPath = file.path;
                    const parts = file.originalFilename.match(/(.*)(\.[^.]+)$/);
                    const ext = parts[2];
                    let newfilename = parts[1] + ext;
                    const imgext = ['.png', '.jpg', '.jpeg'];
                    if (imgext.includes(ext)) {
                        if (filesExist.indexOf(newfilename) > -1) {
                            newfilename = parts[1] + '_' + Math.floor(Math.random() * 10000) + ext;
                        }
                        const newPath = pathData.join(__dirname, '../public/productImages', newfilename);
                        try {
                            await fs.promises.copyFile(oldPath, newPath);
                            imagePaths.push('/productImages/' + newfilename);
                        } catch (err) {
                            // console.error("Error in fs.promises.copyFile:", err);
                            req.flash('type', 'danger');
                            req.flash('message', "Lỗi khi lưu địa chỉ. " + err.message);
                            return res.redirect("/admin/products/" +  productIdValue);
                        }
                        
                    }
                }                
                const newMerchandise =  new Merchandise({productId: productId, quantity: quantity, color: color, status: "Đang bán",
                    importPrice: importPrice, retailPrice: importPrice, retailPrice: retailPrice, storage: storage, imagePath: imagePaths? imagePaths : [] })
                const result = await merchandiseService.createMerchandise(newMerchandise);
                if(result.status){
                    newMerchandise.barcode = result.data._id;
                    let hextId = newMerchandise.barcode;
                    //chỉ lấy 8 giá trị cuối để làm barcode
                    const last8Characters = hextId.slice(-8);
                    //Generate barcode and update merchandise.
                    // console.log(last8Characters);
                    const decimalValue = parseInt(last8Characters, 16);
                    // console.log(decimalValue.toString());
                    await bwipjs.toBuffer({ bcid: 'code128', text: decimalValue.toString(), scale: 3, height: 10 })
                        .then(png => {
                            // tao barcode voi ma code128
                            const barcodename = "barcode_" + result.data._id + ".png";
                            const newPath = pathData.join(__dirname, '../public/barcodes', barcodename);
                            const pathValue = "/barcodes/" + barcodename;
                            fs.writeFile(newPath, png, 'binary', async function (err) {
                                if (err) {
                                    req.flash('type', 'danger');
                                    req.flash('message', "Lỗi khi lưu barcode. " + err.message);
                                    return res.redirect("/admin/products/" + productIdValue);
                                }
                                else {
                                    newMerchandise.barcodeImage = pathValue;
                                    const updated = await merchandiseService.updateMerchandise(newMerchandise);
                                    if(updated.status) {
                                        req.flash('type', 'success');
                                        req.flash('message', "Thêm sản phẩm <strong>" +  productName + "</strong> thành công.");
                                        req.flash("inform", "addDirectly")
                                        return res.redirect("/admin/products/" +  productIdValue);

                                    }
                                    else{
                                        req.flash('type', 'danger');
                                        req.flash('message', "Đã có lỗi xảy ra." +  result.message);
                                        return res.redirect("/admin/products/" +  productIdValue);
                                    }
                                }
                            });
                        })
                        .catch(err => {
                            req.flash('type', 'danger');
                            req.flash('message', "Lỗi khi tạo barcode. " + err.message);
                            return res.redirect("/admin/products/" + productIdValue);
                        });
                }
                else{
                    req.flash('type', 'danger');
                    req.flash('message', "Đã có lỗi xảy ra." +  result.message);
                    return res.redirect("/admin/products/" +  productIdValue);
                }
            }
            else{
                req.flash('type', 'danger');
                req.flash('message', "Đã có lỗi xảy ra." +  productExists.message);
                return res.redirect("/admin/products/" +  productIdValue);
            }
        })
    } 

    async deleteMerchandise(req, res, next) {
        const productIdValue  = req.params.productId;
        if(productIdValue!=null){
            const productExists = await productService.getProductById(productIdValue);
            if(!productExists.status){
                req.flash('type', 'danger');
                req.flash('message', "Đã có lỗi xảy ra." +  productExists.message);
                return res.redirect("/admin/products")
            }
        }
        const merchandiseId = req.body.merchandiseId;
        const productAlreadySold = await invoiceDetailService.getInvoiceDetailByMerchandiseId(merchandiseId);
        if(productAlreadySold.status){
            req.flash('type', 'danger');
            req.flash('message', 'Không thể xóa sản phẩm đã được bán ra.');
            return res.redirect("/admin/products/" +  productIdValue);
        }
        merchandiseService.deleteMerchandise(merchandiseId)
            .then((result) => {
                if (result.status === true) {
                    req.flash('type', 'success');
                    req.flash('message', 'Xóa sản phẩm thành công');
                    return res.redirect("/admin/products/" +  productIdValue);
                }
                else {
                    req.flash('type', 'danger');
                    req.flash('message', 'Xóa sản phẩm thất bại. ' + result.message);
                    return res.redirect("/admin/products/" +  productIdValue);
                }
            })
            .catch((error) => {
                req.flash('type', 'danger');
                req.flash('message', 'Xóa sản phẩm thất bại. ' + error.message);
                return res.redirect("/admin/products/" +  productIdValue);
            })
    }

    async updateMerchandise(req, res, next){
        const productIdValue  = req.params.productId;
        if(productIdValue!=null){
            const productExists = await productService.getProductById(productIdValue);
            if(!productExists.status){
                return res.redirect("/admin/products")
            }
        }
        let filesExist = [];
        try {
            filesExist = await fs.promises.readdir('public/productImages');
        } catch (err) {
            req.flash('type', 'danger');
            req.flash('message', "Lỗi khi fetch ảnh. " + err.message);
            return res.redirect("/admin/products/" +  productIdValue);
        }
        const form = new multiparty.Form()
        form.parse(req, async (err, fields, files) => {
            // console.log(fields)
            if (err){
                req.flash('type', 'danger');
                req.flash('message', "Lỗi khi thêm ảnh hàng hóa. " + err.message);
                return res.redirect("/admin/products/" +  productIdValue);
            }
            //Tìm xem tồn tại sản phẩm hay không
            //Các trường thông tin khác
            //const {merchandiseId, quantity, color, description, status, category, manufacturer, storage, importPrice, retailPrice } =  req.body;
            const merchandiseId = fields.merchandiseId[0];
            const quantity = fields.quantity[0];
            const color = fields.color[0];
            const importPrice = fields.importPrice[0];
            const retailPrice = fields.retailPrice[0];
            const storage = fields.storage[0];
            const description = fields.description[0];
            const status = fields.status[0];    

            const errors = [];

            if (!merchandiseId) {
                errors.push("Vui lòng nhập ID sản phẩm.");
            }
            if (!quantity || quantity < 0) {
                errors.push("Vui lòng nhập số lượng lớn hơn hoặc bằng 0.");
            }
    
            if (!color) {
                errors.push("Vui lòng nhập màu sắc.");
            }
    
            if (!importPrice || importPrice < 0) {
                errors.push("Vui lòng nhập giá nhập lớn hơn 0.");
            }
            if (!retailPrice || retailPrice < 0) {
                errors.push("Vui lòng nhập giá bán lớn hơn 0.");
            }
            // if (!storage) {
            //     errors.push("Vui lòng nhập dung lượng.");
            // } // truồng hop phu kien khong co dung luong
            if (!status) {
                errors.push("Vui lòng nhập trạng thái.");
            }
            if (errors.length > 0) {
                req.flash('type', 'danger');
                let messages = "";
                for (const error of errors) {
                    messages = messages + error + " <br> ";
                }
                req.flash('message',  messages);
                return res.redirect("/admin/products/aboutproduct/" + merchandiseId);
            }

            const merchandiseExists = await merchandiseService.getMerchandiseById(fields.merchandiseId[0]);
            if(merchandiseExists.status == true){
                // console.log(files)
                const imagePaths = []
                if(files.image[0].originalFilename!=''){
                    for (let i = 0; i < files.image.length; i++) {
                        const file = files.image[i];
                        const oldPath = file.path;
                        const parts = file.originalFilename.match(/(.*)(\.[^.]+)$/);
                        const ext = parts[parts.length-1];
                        let newfilename = parts[1] + ext;
                        const imgext = ['.png', '.jpg', '.jpeg'];
                        if (imgext.includes(ext)) {
                            if (filesExist.indexOf(newfilename) > -1) {
                                newfilename = parts[1] + '_' + Math.floor(Math.random() * 10000) + ext;
                            }
                            const newPath = pathData.join(__dirname, '../public/productImages', newfilename);
                            try {
                                await fs.promises.copyFile(oldPath, newPath);
                                imagePaths.push('/productImages/' + newfilename);
                            } catch (err) {
                                console.error("Error in fs.promises.copyFile:", err);
                                req.flash('type', 'danger');
                                req.flash('message', "Lỗi khi lưu địa chỉ. " + err.message);
                                return res.redirect("/admin/products/aboutproduct/" + merchandiseId);
                            }
                            
                        }
                    }   
                }
                             
                const merchandise = merchandiseExists.data;
                merchandise.quantity = quantity;
                merchandise.status = status;
                merchandise.storage = storage;
                merchandise.importPrice = importPrice;
                merchandise.retailPrice = retailPrice;
                merchandise.color = color;
                if(files.image[0].originalFilename!=''){
                    merchandise.imagePath = imagePaths;
                }
                const updateMerchandise = await merchandiseService.updateMerchandise(merchandise);
    
                const productData = await productService.getProductById(merchandise.productId);
                if(productData.status){
                    const product = productData.data;
                    product.description = description;
                    await productService.updateProduct(product);
                }
                else{
                    req.flash('type', 'danger');
                    req.flash('message', 'Sửa hàng hóa thất bại. ' + productData.message );
                    return res.redirect("/admin/products/aboutproduct/" + merchandiseId)
                }
                if(updateMerchandise.status){
                    req.flash('type', 'success');
                    req.flash('message', 'Sửa hàng hóa thành công.');
                    return res.redirect("/admin/products/aboutproduct/" + merchandiseId)
                }
                else{
                    req.flash('type', 'danger');
                    req.flash('message', 'Sửa hàng hóa thất bại. ' + updateMerchandise.message );
                    return res.redirect("/admin/products/aboutproduct/" + merchandiseId)
                }
            }
            else{
                req.flash('type', 'danger');
                req.flash('message', "Đã có lỗi xảy ra." +  merchandiseExists.message);
                return res.redirect("/admin/products/" +  productIdValue);
            }
        })
    }
    // async getAllProducts(req, res, next) {
    //     const products = await productService.getAllProducts()
    //     res.json(products.data);
    // }
    async getAllMerchandises(req, res, next){
        const merchandiseList = await merchandiseService.getAllMerchandises();
        if(!merchandiseList.status){
            // req.flash('type', 'danger');
            // req.flash('message', "Đã có lỗi xảy ra." + );
            return res.status(400).json({status: false, message: merchandiseList.status})
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
            return res.status(200).json({status: true, data: merchandisesResult});
        }
    }//api


    //api get products by filtering
    async filterMerchandises(req, res, next) {
        const {productId, price, status, dateImport} = req.body;
        const filterObject = {};

        if (price) {
            if(price.substr(0, 2) == "lt"){
                const filterprice = price.substr(2, price.length);
                filterObject.retailPrice = { $lt: parseInt(filterprice)};
            }
            else{
                const filterprice = price.substr(2, price.length);
                filterObject.retailPrice = { $gt: parseInt(filterprice)};
            }
        }
        if (dateImport) {
            const startDate = new Date(dateImport);
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1);
            filterObject.createdAt = {$gte: startDate.toISOString(),$lt: endDate.toISOString()};
        }
        // const merchandisesList = await merchandiseService.getAllMerchandisesByProductId(productId);
        const merchandisesList = await merchandiseService.getMerchandisesByIdAndFilter(productId, filterObject);
        let merchandisesResults = [];
        if(merchandisesList.status){
            for (const merchandise of merchandisesList.data) {
                const product = await productService.getProductById(merchandise.productId);
                merchandise.createdAt = formatTimeInVietnamTimeZone(merchandise.createdAt);
                merchandise.product = product.data;
                if(status!=""){
                    if(status == "stocking"){
                        console.log(merchandise.quantity);
                        if(merchandise.quantity > 0){
                            merchandisesResults.push(merchandise);
                        }
                    }else{
                        if(merchandise.quantity == 0){
                            merchandisesResults.push(merchandise);
                        }
                    }
                }
                else{
                    merchandisesResults.push(merchandise);
                }
            }
        }
        res.status(200).json(merchandisesResults); 
    }
}

module.exports = new MerchandiseAdminController;
