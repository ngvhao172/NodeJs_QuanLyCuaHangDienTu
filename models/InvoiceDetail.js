const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceDetail = new Schema({ 
    merchandiseId: String,
    quantity: Number,
    total: Number,
    invoiceId: String
});

module.exports = mongoose.model('InvoiceDetail', InvoiceDetail);