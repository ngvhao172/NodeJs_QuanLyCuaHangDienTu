const {mongooseToObject} = require('../utils/convertMongoose')
const {multipleMongooseToObject} = require('../utils/convertMongoose')
const Invoice = require('../models/Invoice');
class InvoiceService{
    async getAllInvoices(){
        return await Invoice.find({})
            .then((invoices) => {
                if (invoices) {
                    return { status: true, data: multipleMongooseToObject(invoices)};
                }else {
                    return { status: false, message: 'Invoices not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }

    async addNewInvoice(invoice){
        try {
            const result = await invoice.save();
            return { status: true, data: mongooseToObject(result) };
          } catch (error) {
            return { status: false, message: error.message };
          }
    }

    async getInvoiceById(invoiceId){
        return await Invoice.findById(invoiceId)
        .then((invoice) => {
            if (invoice) {
                return { status: true, data: mongooseToObject(invoice) };
            } else {
                return { status: false, message: 'Invoice not found' };
            }
        })
        .catch((error) => {
            return { status: false, message: error.message };
        });
    }

    async getRecentlyInvoice(customerId){
        return await Invoice.findOne({customerId:  customerId}).sort({ createdAt: -1 })
        .then((invoice) => {
            if (invoice) {
                return { status: true, data: mongooseToObject(invoice) };
            } else {
                return { status: false, message: 'Invoice not found' };
            }
        })
        .catch((error) => {
            return { status: false, message: error.message };
        });
    }
    async getAllInvoicesByCustomerId(customerId) {
        return await Invoice.find({customerId})
            .then((invoices) => {
                if (invoices) {
                    return { status: true, data: multipleMongooseToObject(invoices)};
                }else {
                    return { status: false, message: 'Invoices not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async getAllInvoicesByEmployeeId(employeeId) {
        return await Invoice.find({employeeId})
            .then((invoices) => {
                if (invoices) {
                    return { status: true, data: multipleMongooseToObject(invoices)};
                }else {
                    return { status: false, message: 'Invoices not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async updateInvoice(invoice){
        try {
            const updateInvoice = await Invoice.findByIdAndUpdate({_id: invoice._id}, invoice);
            return { status: true, data: mongooseToObject(updateInvoice) };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
    async deleteInvoice(invoiceId) {
        try {
          const invoiceToDelete = await Invoice.findByIdAndDelete(invoiceId);
      
          if (!invoiceToDelete) {
            return { status: false, message: "Invoice not found" };
          }
      
          return { status: true, data: mongooseToObject(invoiceToDelete) };
        } catch (error) {
          return { status: false, message: error.message };
        }
    }
    async getInvoiceByDate(startDate, endDate) {
        return await Invoice.find({"createdAt": {$gt: startDate, $lt: endDate}})
            .then((invoices) => {
                if (invoices) {
                    return { status: true, data: multipleMongooseToObject(invoices)};
                }else {
                    return { status: false, message: 'Invoices not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
}

module.exports = new InvoiceService;