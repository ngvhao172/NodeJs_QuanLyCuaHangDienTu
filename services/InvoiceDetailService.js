const {mongooseToObject} = require('../utils/convertMongoose')
const {multipleMongooseToObject} = require('../utils/convertMongoose')
const InvoiceDetail = require('../models/InvoiceDetail');
class InvoiceService{
    async getAllInvoiceDetails(){
        return await InvoiceDetail.find({})
            .then((invoices) => {
                if (invoices) {
                    return { status: true, data: multipleMongooseToObject(invoices)};
                }else {
                    return { status: false, message: 'InvoiceDetails not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }

    async addNewInvoiceDetail(invoiceDetail){
        try {
            const result = await invoiceDetail.save();
            return { status: true, data: mongooseToObject(result) };
          } catch (error) {
            return { status: false, message: error.message };
          }
    }
    async getInvoicesDetailByInvoiceId(invoiceId){
        return await InvoiceDetail.find({invoiceId: invoiceId})
        .then((invoiceDetails) => {
            if (invoiceDetails) {
                return { status: true, data: multipleMongooseToObject(invoiceDetails)};
            } else {
                return { status: false, message: 'InvoiceDetails not found' };
            }
        })
        .catch((error) => {
            return { status: false, message: error.message };
        });
    }
    async getInvoiceDetailById(invoiceDetailId){
        return await Invoice.findById(invoiceDetailId)
        .then((invoiceDetail) => {
            if (invoiceDetail) {
                return { status: true, data: mongooseToObject(invoiceDetail) };
            } else {
                return { status: false, message: 'InvoiceDetail not found' };
            }
        })
        .catch((error) => {
            return { status: false, message: error.message };
        });
    }
    async getAllInvoiceDetailByInvoiceId(invoiceId){
        return await InvoiceDetail.find({invoiceId})
            .then((invoices) => {
                if (invoices) {
                    return { status: true, data: multipleMongooseToObject(invoices)};
                }else {
                    return { status: false, message: 'InvoiceDetails not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async getInvoiceDetailByMerchandiseId(merchandiseId){
        return await InvoiceDetail.findOne({merchandiseId: merchandiseId})
        .then((invoiceDetail) => {
            if (invoiceDetail) {
                return { status: true, data: mongooseToObject(invoiceDetail)};
            }else {
                return { status: false, message: 'InvoiceDetails not found' };
            }
        })
        .catch((error) => {
            return { status: false, message: error.message };
        });
    }
}

module.exports = new InvoiceService;