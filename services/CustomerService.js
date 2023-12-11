const {mongooseToObject} = require('../utils/convertMongoose')
const {multipleMongooseToObject} = require('../utils/convertMongoose')
const Customer = require('../models/Customer');
class CustomerService{
    async getAllCustomers(){
        return await Customer.find({})
            .then((customers) => {
                if (customers) {
                    return { status: true, data: multipleMongooseToObject(customers)};
                }else {
                    return { status: false, message: 'Customers not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }

    async addNewCustomer(customer){
        try {
            const result = await customer.save();
            return { status: true, data: mongooseToObject(result) };
          } catch (error) {
            return { status: false, message: error.message };
          }
    }
    async getCustomerByName(fullName) {
        return await Customer.find({ fullName: fullName })
            .then((customers) => {
                if (customers) {
                    return { status: true, data: multipleMongooseToObject(customers) };
                } else {
                    return { status: false, message: 'Customers not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    
    async getCustomerByPhoneNumber(phoneNumber) {
        return await Customer.findOne({phoneNumber: phoneNumber})
            .then((customer) => {
                if (customer) {
                    return { status: true, data: mongooseToObject(customer) };
                } else {
                    return { status: false, message: 'Customer not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async getCustomerById(customerId){
        return await Customer.findById(customerId)
        .then((customer) => {
            if (customer) {
                return { status: true, data: mongooseToObject(customer) };
            } else {
                return { status: false, message: 'Customer not found' };
            }
        })
        .catch((error) => {
            return { status: false, message: error.message };
        });
    }

    async getCustomersByFilter(filter){
        return await Customer.find(filter)
            .then((customers) => {
                if (customers) {
                    return { status: true, data: multipleMongooseToObject(customers)};
                }else {
                    return { status: false, message: 'Customers not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
}

module.exports = new CustomerService;