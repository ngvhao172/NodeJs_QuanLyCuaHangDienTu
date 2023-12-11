const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({ 
    userEmail: String,
    fullName: String,
    phoneNumber: String,
    address: String,
    dob: Date,
    avatar: String,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
      }
}, {timestamps: true});

module.exports = mongoose.model('User', User);