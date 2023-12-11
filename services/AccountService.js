const { mongooseToObject } = require('../utils/convertMongoose')
const Account = require('../models/Account');

class AccountService {

    async createAccount(newAccount) {
        try {
            const result = await newAccount.save();
            return { status: true, data: result };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
    async getAccountByEmail(email) {
        try {
            const account = await Account.findOne({ userEmail: email });
            if (account) {
                return { status: true, data: mongooseToObject(account) };
            } else {
                return { status: false, message: "Không tìm thấy tài khoản với email: " + email };
            }
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
    async getAccountByUserId(userId) {
        try {
            const account = await Account.findOne({ userId: userId });
            if (account) {
                return { status: true, data: mongooseToObject(account) };
            } else {
                return { status: false, message: "Không tìm thấy tài khoản với userId: " + userId };
            }
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
    async getAccountByUsername(username) {
        try {
            const account = await Account.findOne({ userName: username });
            if (account) {
                return { status: true, data: mongooseToObject(account) };
            } else {
                return { status: false, message: "Không tìm thấy tài khoản với username: " + username };
            }
        } catch (error) {
            return { status: false, message: error.message };
        }
    }

    async updateAccountStatus(userID) {
        return await Account.findOneAndUpdate({ userId: userID }, { verified: true })
            .then((account) => {
                return { status: true, data: mongooseToObject(account) };
            })
            .catch((error) => {
                return { status: false, message: error.message };
            })
    }

    async updatePassword(account) {
        try {
            const savedAccount = await Account.findByIdAndUpdate({ _id: account._id }, { password: account.password, changePassword: account.changePassword });
            return { status: true, data: mongooseToObject(savedAccount) };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
    async updateAccount(account) {
        try {
            const updateAccount = await Account.findByIdAndUpdate({ _id: account._id }, account);
            return { status: true, data: mongooseToObject(updateAccount) };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
}

module.exports = new AccountService;