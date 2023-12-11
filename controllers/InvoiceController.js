const Invoice = require("../models/Invoice");
const InvoiceDetail = require("../models/InvoiceDetail");
const invoiceService = require("../services/InvoiceService");
const invoiceDetailService = require("../services/InvoiceDetailService");
const merchandiseService = require("../services/MerchandiseService");
class InvoiceController {
    async addNewInvoice(req, res, next) {
        const { customername, customerId, method, totalBill, totalAfterDiscount, totalRefund, totalReceive, cashierId, note, discount } = req.body;
        const productsOnBill = req.body['productsOnBill'];
        if (!productsOnBill) {
            req.flash('type', 'danger');
            req.flash('message', "Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.");
            return res.redirect("/user/POS")
        }
        const errors = [];

        if (!customername) {
            errors.push("Vui lòng nhập tên khách hàng.");
        }
        if (!totalAfterDiscount) {
            errors.push("Vui lòng nhập tổng tiền sau khi giảm giá.");
        }
        if (!method) {
            errors.push("Vui lòng chọn phương thức thanh toán.");
        }
        if(method === "Cash"){
            if (!totalRefund) {
                errors.push("Vui lòng nhập tổng tiền hoàn lại.");
            }
    
            if (!totalReceive) {
                errors.push("Vui lòng nhập tổng tiền nhận được.");
            }

            if(parseInt(totalReceive) < parseInt(totalAfterDiscount)){
                req.flash('type', 'danger');
                req.flash('message', "Số tiền trả không được bé hơn số tiền sản phẩm đã mua");
                return res.redirect("/user/POS");
            }
        }
        if (!customerId) {
            errors.push("Vui lòng nhập mã khách hàng.");
        }

        if (!cashierId) {
            errors.push("Vui lòng nhập mã người thu ngân.");
        }

        if (!totalBill) {
            errors.push("Vui lòng nhập tổng tiền hóa đơn.");

        }
        if (errors.length > 0) {
            req.flash('type', 'danger');
            let messages = "";
            for (const error of errors) {
                messages = messages + error + " <br> ";
            }
            req.flash('message',  messages);
            return res.redirect("/user/POS");
        }
        for (const productValue of productsOnBill) {
            const product = JSON.parse(productValue);
            const checkQuantity =  await merchandiseService.getMerchandiseById(product.productId);
            if(checkQuantity.status){
                const quantity = checkQuantity.data.quantity;
                if(parseInt(quantity) < parseInt(product.quantity)){
                    req.flash('type', 'danger');
                    req.flash('message', "Quá số lượng sản phẩm " + product.name + " có trong cửa hàng");
                    return res.redirect("/user/POS");
                }
            }
        }
        if(method === 'Cash'){
            const newInvoice = new Invoice({ moneyGiven: totalReceive, moneyRefund: totalRefund, totalAmount: totalBill, employeeId: cashierId, customerId: customerId, note: note, method: method, totalAfterDiscount: totalAfterDiscount, discount: discount? discount : 0, status: "Paid" });
            const invoiceCreated = await invoiceService.addNewInvoice(newInvoice);
            if (invoiceCreated.status) {
                for (const productValue of productsOnBill) {
                    const product = JSON.parse(productValue);
                    const total = parseInt(product.price) * parseInt(product.quantity);
                    // console.log(product)
                    const newInvoiceDetail = new InvoiceDetail({ merchandiseId: product.productId, quantity: product.quantity, total: total, invoiceId: invoiceCreated.data._id });
                    const invoiceDetailCreated = await invoiceDetailService.addNewInvoiceDetail(newInvoiceDetail);
                    if (!invoiceDetailCreated.status) {
                        req.flash('type', 'danger');
                        req.flash('message', "Đã có lỗi xảy ra. " + invoiceDetailCreated.message);
                        return res.redirect("/user/POS")
                    }
                    else{
                        //giảm số lượng sản phẩm đi
                        const updatedmerchandise = await merchandiseService.getMerchandiseById(product.productId);
                        // console.log(updatedmerchandise);
                        if(updatedmerchandise.status){
                            const oldSoLuong = updatedmerchandise.data.quantity;
                            const newSoLuong = oldSoLuong - parseInt(product.quantity);
                            const updatedMerchandise = updatedmerchandise.data;
                            updatedMerchandise.quantity = newSoLuong;

                            const updated = await merchandiseService.updateMerchandise(updatedMerchandise);
                            if(!updated.status){
                                req.flash('type', 'danger');
                                req.flash('message', "Đã có lỗi xảy ra. " + updated.message);
                                return res.redirect("/user/POS")
                            }
                        }
                    }
                }
                return res.redirect("/user/getInvoice/" + invoiceCreated.data._id);
            }
        }
        else if(method == 'MOMO'){
            const newInvoice = new Invoice({ moneyGiven: totalAfterDiscount, moneyRefund: 0, totalAmount: totalBill, employeeId: cashierId, customerId: customerId, note: note, method: method, totalAfterDiscount: totalAfterDiscount, discount: discount? discount : 0, status: "Unpaid" });
            const invoiceCreated = await invoiceService.addNewInvoice(newInvoice);
            if (invoiceCreated.status) {
                for (const productValue of productsOnBill) {
                    const product = JSON.parse(productValue);
                    const total = parseInt(product.price) * parseInt(product.quantity);
                    // console.log(product)
                    const newInvoiceDetail = new InvoiceDetail({ merchandiseId: product.productId, quantity: product.quantity, total: total, invoiceId: invoiceCreated.data._id });
                    const invoiceDetailCreated = await invoiceDetailService.addNewInvoiceDetail(newInvoiceDetail);
                    if (!invoiceDetailCreated.status) {
                        req.flash('type', 'danger');
                        req.flash('message', "Đã có lỗi xảy ra. " + invoiceDetailCreated.message);
                        return res.redirect("/user/POS")
                    }
                }
                return res.redirect("/user/momo-payment/" + invoiceCreated.data._id + "/" + totalAfterDiscount);
            }
            else{
                req.flash('type', 'danger');
                req.flash('message', "Đã có lỗi xảy ra. " + invoiceCreated.message);
                return res.redirect("/user/POS")
            }
        }
        req.flash('type', 'danger');
        req.flash('message', "Đã có lỗi xảy ra. " + invoiceCreated.message);
        return res.redirect("/user/POS")
    }

}
module.exports = new InvoiceController