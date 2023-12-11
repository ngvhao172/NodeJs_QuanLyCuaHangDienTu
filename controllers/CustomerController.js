const customerService = require("../services/CustomerService")
const Customer = require("../models/Customer")
const invoiceService = require('../services/InvoiceService');
const { formatTimeInVietnamTimeZone } = require('../utils/convertToVNTimeZone');
class CustomerController {

    //PAGES
    // async adminIndex(req, res, next){
    //     const customerList = await customerService.getAllCustomers();
    //     let customersResults = [];
    //     for (const customer of customerList.data) {
    //         const lastInvoice = await invoiceService.getRecentlyInvoice(customer._id);
    //         if(lastInvoice.status){
    //             customer.recentlyInvoice = lastInvoice.data;
    //         }
    //         customersResults.push(customer);
    //     }
    //     customersResults.length = customerList.data.length;
    //     res.render("pages/admin/listcustomer", { customers: customersResults, isAdmin })
    // }

    // async userIndex(req, res, next){
    //     const customerList = await customerService.getAllCustomers();
    //     let customersResults = [];
    //     for (const customer of customerList.data) {
    //         const lastInvoice = await invoiceService.getRecentlyInvoice(customer._id);
    //         if(lastInvoice.status){
    //             customer.recentlyInvoice = lastInvoice.data;
    //         }
    //         customersResults.push(customer);
    //     }
    //     customersResults.length = customerList.data.length;
    //     res.render("pages/admin/listcustomer", { customers: customersResults, isAdmin })
    // }


    //ACTIONS
    async addNewCustomer(req, res, next){
        const {fullName, phoneNumber, address} =  req.body;
        if(!fullName || !phoneNumber ){
            return res.status(400).json({success: false, message: "Vui lòng nhập đủ thông tin người dùng."})
        }
        const customerExisted = await customerService.getCustomerByPhoneNumber(phoneNumber);
        if(customerExisted.status){
            return res.status(400).json({success: false, message: "Số điện thoại khách hàng đã được đăng ký trong hệ thống."})
        }
        const customer = new Customer({fullName: fullName, phoneNumber: phoneNumber, address: address})
        const newCustomer = await customerService.addNewCustomer(customer)
        if(newCustomer.status){
            return res.status(200).json({success: true, data : newCustomer.data})
        }
        else{
            return res.status(400).json({success: false, message: newCustomer.message})
        }
    }//api

    async getAllCustomers(req, res, next){
        const customerList = await customerService.getAllCustomers();
        if(!customerList.status){
            req.flash('type', 'danger');
            req.flash('message', "Đã có lỗi xảy ra." + customerList.status);
            return res.status(400).json({status: false, message: "Error"})
        }
        else{
            const customers = customerList.data;
            return res.status(200).json({customers});
        }
    }//api
    async filterCustomers(req, res){
        const {name, phonenumber} = req.body;
        // console.log(name, status);
        const filterObject = {};
        if (name) {
            filterObject.fullName = { $regex: new RegExp(name, 'i') };
        }
        if (phonenumber) {
            filterObject.phoneNumber = { $regex: new RegExp(phonenumber, 'i') };
        }
        const customerList = await customerService.getCustomersByFilter(filterObject);
        let customersResults = [];
        if(customerList.status){
            for (const customer of customerList.data) {
                const lastInvoice = await invoiceService.getRecentlyInvoice(customer._id);
                console.log(lastInvoice)
                if (lastInvoice.status) {
                    customer.recentlyInvoice = lastInvoice.data;
                    customer.recentlyInvoice.createdAt = formatTimeInVietnamTimeZone(customer.recentlyInvoice.createdAt)
                }
                else{
                    customer.recentlyInvoice = 0; 
                }
                customersResults.push(customer);
            }    
        }
        customersResults.length = customerList.data.length ? customerList.data.length : 0;
        res.status(200).json(customersResults); 
    }
}

module.exports = new CustomerController;