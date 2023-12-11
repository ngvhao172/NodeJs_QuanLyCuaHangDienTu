const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Product = new Schema({ 
    productName: String,
    manufacturer: String,
    description: String,
    category: String,
}, {timestamps : true});

module.exports = mongoose.model('Product', Product);