const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Invoice = new Schema({ 
    discount: Number, //discount
    moneyGiven: Number,
    moneyRefund: Number,
    totalAmount: Number,// tong tien hang
    totalAfterDiscount: Number, //tong tien sau khi discount
    employeeId: String,
    customerId: String,
    method: String,
    note: String,
    status:  {
        type: String,
        enum: ['Paid', 'Unpaid']
      } ,
},{timestamps : true});

module.exports = mongoose.model('Invoice', Invoice);