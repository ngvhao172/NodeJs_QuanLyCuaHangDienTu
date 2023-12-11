const {mongooseToObject} = require('../utils/convertMongoose')
const {multipleMongooseToObject} = require('../utils/convertMongoose')
const User = require('../models/User');
// const userVerificationService = require('./UserVerificationService');
class UserService{
    async getAllUsers(){
        return await User.find({})
            .then((users) => {
                if (users) {
                    return { status: true, data: multipleMongooseToObject(users)};
                }else {
                    return { status: false, message: 'Users not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async getUserByEmail(email) {
        return await User.findOne({ userEmail: email })
            .then((user) => {
                if (user) {
                    return { status: true, data: mongooseToObject(user) };
                } else {
                    return { status: false, message: 'User not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    
    async getUserById(userId) {
        return await User.findById(userId)
            .then((user) => {
                if (user) {
                    return { status: true, data: mongooseToObject(user) };
                } else {
                    return { status: false, message: 'User not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    
    async createUser(newUser) {
        try {
          const result = await newUser.save();
          return { status: true, data: mongooseToObject(result) };
        } catch (error) {
          return { status: false, message: error.message };
        }
    }
    async updateUser(user) {
        // console.log(user);
        try {
            const updatedUser = await User.findOneAndUpdate(
                { userEmail: user.userEmail },
                {
                    fullName: user.fullName,
                    address: user.address,
                    dob: user.dob,
                    phoneNumber: user.phoneNumber,  
                    gender: user.gender,
                    avatar: user.avatar
                },
                { new: true } // ban ghi sau cap nhat
            );
            if (updatedUser) {
                return { status: true, data: updatedUser };
            } else {
                return { status: false, message: 'User not found or not updated.' };
            }
        } catch (error) {
            return { status: false, message: error.message };
        }
    } 
    async getUsersByFilter(filter){
        return await User.find(filter)
            .then((users) => {
                if (users) {
                    return { status: true, data: multipleMongooseToObject(users)};
                }else {
                    return { status: false, message: 'Users not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
}

module.exports = new UserService;