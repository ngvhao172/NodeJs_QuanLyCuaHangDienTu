const crypto = require('crypto');
const https = require('https');
const invoiceService = require('../services/InvoiceService');
const invoiceDetailService = require('../services/InvoiceDetailService');
const merchandiseService = require("../services/MerchandiseService");

class MomoPaymentController {
    paymentWithMomo(req, res) {
        const { invoiceId, total } = req.params;

        const partnerCode = "MOMO";
        const accessKey = process.env.ACCESSKEY;
        const secretKey = process.env.SECRETKEY;
        const requestId = partnerCode + new Date().getTime();
        const orderId = requestId;
        const orderInfo = "Thanh toán qua ví MoMo";
        const requestType = "captureWallet";

        const redirectUrl = "https://smartech.onrender.com//user/getResultTransaction";
        const ipnUrl = "https://smartech.onrender.com//user/momo-callback";
        const amount = total; // tổng số tiền
        // const amount = "50000";
        const extraData = invoiceId;

        // Tạo chữ ký số (signature)
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

        // Tạo yêu cầu thanh toán
        const requestBody = JSON.stringify({
            partnerCode: partnerCode,
            accessKey: accessKey,
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            lang: 'en'
        });

        const options = {
            hostname: 'test-payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            }
        };

        const requestToMomo = https.request(options, momoRes => {
            let data = '';

            momoRes.on('data', chunk => {
                data += chunk;
            });

            momoRes.on('end', () => {
                const response = JSON.parse(data);
                // console.log(response);
                if (response.resultCode === 0) {
                    // Chuyển hướng người dùng đến URL thanh toán
                    res.redirect(response.payUrl);
                } else {
                    // Thanh toán thất bại
                    // console.log('Thanh toán thất bại');
                    // console.log('Lý do thất bại:', response.message);
                    // res.status(400).send('Thanh toán thất bại: ' + response.message);
                    req.flash("type", "danger");
                    req.flash("message", response.message);
                    return res.redirect("/user/POS")
                }
            });

        });
        requestToMomo.on('error', error => {
            // console.error(`Problem with request: ${error.message}`);
            // res.status(500).send('Internal Server Error');

            req.flash("type", "danger");
            req.flash("message", error.message);
            return res.redirect("/user/POS")
        });
        
        requestToMomo.write(requestBody);
        requestToMomo.end();
    }

    // momoCallBack(req, res) {
    //     console.log("CALLBACKCALLED");
    //     const response = req.body; // Phản hồi từ MoMo
    //     console.log("CALLBACKDATA", response);
    //     // Kiểm tra trạng thái thanh toán và xử lý dựa trên nó
    //     if (response.resultCode === 0) {
    //         // Thanh toán thành công
    //         console.log('Thanh toán thành công');
    //         console.log(response);
    //         // Thực hiện các hành động cần thiết sau thanh toán thành công ở đây
    //     } else {
    //         // Thanh toán thất bại
    //         console.log('Thanh toán thất bại');
    //         console.log('Lý do thất bại:', response.message);
    //         // Thực hiện xử lý cho trường hợp thanh toán thất bại ở đây
    //     }
    
    //     // Phản hồi với MoMo để xác nhận đã nhận được phản hồi
    //     res.send('Received'); // Phản hồi thành công
    // }
    async getResultTransaction(req, res){
        const {resultCode, extraData, message} = req.query;
        console.log(req.query);
        // console.log(resultCode, extraData, message)
        if(resultCode == 0){
            const invoiceData = await invoiceService.getInvoiceById(extraData);
            if (invoiceData.status) {
                const invoice = invoiceData.data;
                const invoiceDetailsData = await invoiceDetailService.getAllInvoiceDetailByInvoiceId(invoice._id);
                if(invoiceDetailsData.status){
                    const invoiceDetails = invoiceDetailsData.data;
                    for(const invoiceDetail of invoiceDetails){
                         //giảm số lượng sản phẩm đi
                        const updatedmerchandise = await merchandiseService.getMerchandiseById(invoiceDetail.merchandiseId);
                        //console.log(updatedmerchandise);
                        if(updatedmerchandise.status){
                            const oldSoLuong = updatedmerchandise.data.quantity;
                            const newSoLuong = oldSoLuong - parseInt(invoiceDetail.quantity);
                            const updatedMerchandise = updatedmerchandise.data;
                            updatedMerchandise.quantity = newSoLuong;
                            const updated = await merchandiseService.updateMerchandise(updatedMerchandise);
                            if(!updated.status){
                                await invoiceService.deleteInvoice(extraData);
                                req.flash('type', 'danger');
                                req.flash("message","Đã có lỗi xảy ra trong quá trình thanh toán. " + updated.message);
                                return res.redirect("/user/POS");
                            }
                        }
                        else{
                            await invoiceService.deleteInvoice(extraData);
                            req.flash('type', 'danger');
                            req.flash("message","Đã có lỗi xảy ra trong quá trình thanh toán. " + updatedmerchandise.message);
                            return res.redirect("/user/POS");
                        }
                    }
                    invoice.status = "Paid";
                    const invoiceUpdatedData = await invoiceService.updateInvoice(invoice);
                    if(invoiceUpdatedData.status){
                        //trả về invoice
                        return res.redirect("/user/getInvoice/" + extraData);
                    }
                    else{
                        await invoiceService.deleteInvoice(extraData);
                        req.flash('type', 'danger');
                        req.flash("message","Đã có lỗi xảy ra trong quá trình thanh toán. " + invoiceUpdatedData.message);
                        return res.redirect("/user/POS");
                    }
                }
                else{
                    await invoiceService.deleteInvoice(extraData);
                    req.flash('type', 'danger');
                    req.flash("message","Đã có lỗi xảy ra trong quá trình thanh toán. " + invoiceDetailsData.message);
                    return res.redirect("/user/POS");
                }
            }
            else{
                await invoiceService.deleteInvoice(extraData);
                req.flash("type", "danger");
                req.flash("message","Đã có lỗi xảy ra trong quá trình thanh toán. " + invoiceData.message);
                return res.redirect("/user/POS");
            }
        }
        else{
            await invoiceService.deleteInvoice(extraData);
            req.flash("type", "danger");
            req.flash("message","Đã có lỗi xảy ra trong quá trình thanh toán. " + message);
            return res.redirect("/user/POS");
        }
    }
}

module.exports = new MomoPaymentController;