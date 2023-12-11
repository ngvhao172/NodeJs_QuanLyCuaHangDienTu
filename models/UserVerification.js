const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserVerification = new Schema({ 
    userId: String,
    uniqueString: String,
    type: {
        type: String,
        enum: ['ForgotPassword', 'Verification']
      },
    createdAt: Date,
    expiredAt: Date
});

module.exports = mongoose.model('UserVerification', UserVerification);