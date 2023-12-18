const mongoose = require('mongoose');
async function connect() {
    try {
        await mongoose.connect('mongodb+srv://ngvhao:ha59vNeuANw23ceF@smartech.bshzguc.mongodb.net/quanlycuahangdienthoai?retryWrites=true&w=majority')
        .then(() => console.log("Connected to MongoDB successfully"));
      
    } catch (error) {
        console.log(error);
    }
}
module.exports = { connect };  