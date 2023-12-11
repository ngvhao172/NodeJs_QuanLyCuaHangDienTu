const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Customer = new Schema({ 
    fullName: String,
    phoneNumber: String,
    address: String
}, {timestamps: true});

module.exports = mongoose.model('Customer', Customer);