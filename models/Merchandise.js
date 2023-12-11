const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Mechandise = new Schema({ 
    productId: String,
    quantity: Number,
    importPrice: Number,
    retailPrice: Number,
    color: String,
    barcode : String, // mã vạch
    imagePath: [String],
    barcodeImage: String,
    storage: String,
    status: {
        type: String,
        enum: ['Đang bán', 'Ngừng bán']
      }  
}, {timestamps : true});

module.exports = mongoose.model('Mechandise', Mechandise);