const userService = require('../services/UserService');
const accountService = require('../services/AccountService');
const productService = require('../services/ProductService');
const merchandiseService = require('../services/MerchandiseService');
const { formatTimeInVietnamTimeZone } = require('../utils/convertToVNTimeZone');
const customerService = require('../services/CustomerService');
const invoiceService = require('../services/InvoiceService');
const invoiceDetailService = require('../services/InvoiceDetailService');

class AdminController {

    async profile(req, res, next) {
        // console.log(req.user)
        const accountData = await accountService.getAccountByEmail(req.user.userEmail);
        // console.log(accountData)
        res.render("pages/admin/info", { userAccount: accountData.data });
    }

    async index(req, res, next) {
        try {
            const invoicesData = await invoiceService.getAllInvoices();

            if (invoicesData.status) {
                const invoices = invoicesData.data;
                let totalInvoice = invoices.length;
                // console.log(totalInvoice);
                let totalSale = 0;
                let totalProfit = 0;
                let totalPaymentWithMomo = 0;
                let totalDiscount = 0;

                for (const invoice of invoices) {
                    totalDiscount += invoice.discount;
                    const invoiceDetails = await invoiceDetailService.getAllInvoiceDetailByInvoiceId(invoice._id);
                    if (invoice.method === "MOMO") {
                        totalPaymentWithMomo += invoice.totalAmount;
                    }
                    if (invoiceDetails.status) {
                        invoice.invoiceDetails = invoiceDetails.data;
                        let totalProductInInvoice = 0;
                        let totalProfitInInvoice = 0;
                        let totalSaleInInvoice = 0;
                        let totalHistoryCost = 0;
                        for (const invoiceDetail of invoiceDetails.data) {
                            invoiceDetail.totalProduct = totalProductInInvoice;
                            invoiceDetail.totalProfitInInvoice = totalProfitInInvoice;
                            const merchandiseData = await merchandiseService.getMerchandiseById(invoiceDetail.merchandiseId);

                            if (merchandiseData.status) {
                                const productData = await productService.getProductById(merchandiseData.data.productId);

                                if (productData.status) {
                                    const merchandise = merchandiseData.data;
                                    merchandise.productName = productData.data.productName;
                                    invoiceDetail.product = merchandise;

                                    const quantity = parseInt(invoiceDetail.quantity);
                                    const importPrice = parseFloat(merchandise.importPrice);
                                    const retailPrice = parseFloat(merchandise.retailPrice);
                                    const profitPerProduct = (retailPrice - importPrice) * quantity;
                                    totalProfitInInvoice += profitPerProduct;
                                    totalProductInInvoice += parseInt(invoiceDetail.quantity);
                                    totalSaleInInvoice += retailPrice * quantity;
                                    totalHistoryCost += importPrice * quantity;
                                }
                            }
                        }
                        totalProfit += totalProfitInInvoice - totalDiscount;
                        totalSale += totalSaleInInvoice;
                    }
                }
                res.render("pages/admin/home", { totalProfit, totalPaymentWithMomo, totalSale, totalInvoice });
            } else {
                // console.log(invoicesData.message)
                res.render("pages/admin/home");
            }
        } catch (error) {
            // console.log(error.message)
            res.render("pages/admin/home");
        }
    }
    async listEmployees(req, res, next) {
        const employeesList = await userService.getAllUsers();
        let employeesResults = [];
        let updatedAt = new Date(2000, 1, 1);
        if (employeesList.status) {
            for (const element of employeesList.data) {
                if (element.userEmail !== "admin@gmail.com") {
                    const account = await accountService.getAccountByEmail(element.userEmail);
                    if (account.data.updatedAt > updatedAt) {
                        updatedAt = account.data.updatedAt;
                    }
                    const newEmployeeData = {
                        user: element,
                        account: account.data
                    };
                    employeesResults.push(newEmployeeData);
                }
            }
        }
        res.render("pages/admin/listemployee", { employees: employeesResults, updatedAt: updatedAt })
    }

    async aboutEmployee(req, res, next) {
        const employeeId = req.params.employeeId;
        const result = await userService.getUserById(employeeId);
        if (result.status) {
            const employee = result.data;
            const accountResult = await accountService.getAccountByUserId(employee._id);
            if (accountResult.status) {
                employee.account = accountResult.data;
            }
            //
            let totalInvoice = 0;
            let totalAmount = 0;
            let totalDiscount = 0;
            let totalSelling = 0;
            const invoicesData = await invoiceService.getAllInvoicesByEmployeeId(employee._id);
            if (invoicesData.status) {
                totalInvoice = invoicesData.data.length;
                // let invoiceDetailsList = [];
                for (const invoice of invoicesData.data) {
                    totalAmount += parseInt(invoice.totalAmount);
                    totalDiscount += parseInt(invoice.discount);
                    totalSelling += parseInt(invoice.totalAfterDiscount);
                    const invoiceDetails = await invoiceDetailService.getAllInvoiceDetailByInvoiceId(invoice._id);
                    if (invoiceDetails.status) {
                        invoice.invoiceDetails = invoiceDetails.data;
                        let totalProduct = 0;
                        for (const invoiceDetail of invoiceDetails.data) {
                            // invoiceDetail.totalProduct = totalProduct
                            totalProduct += parseInt(invoiceDetail.quantity)
                            // console.log(invoiceDetail);
                            // const productData = await productService.getProductById(invoiceDetail.productId);
                            const merchandiseData = await merchandiseService.getMerchandiseById(invoiceDetail.merchandiseId);
                            if (merchandiseData.status) {
                                const productData = await productService.getProductById(merchandiseData.data.productId);
                                if (productData.status) {
                                    const merchandise = merchandiseData.data;
                                    merchandise.productName = productData.data.productName;
                                    invoiceDetail.product = merchandise;
                                }
                            }
                            // console.log(invoiceDetail)
                        }
                        invoice.totalProduct = totalProduct;
                    }
                    const customerData = await customerService.getCustomerById(invoice.customerId);
                    if (customerData.status) {
                        invoice.customer = customerData.data;
                    }
                }
                employee.invoicesList = invoicesData.data;
                employee.totalInvoice = totalInvoice;
                employee.totalAmount = totalAmount;
                employee.totalDiscount = totalDiscount;
                employee.totalSelling = totalSelling;
            }
            // console.log(employee)
            return res.render("pages/admin/aboutemployee", { employee: employee })
        }
        return res.redirect("/notfound")

    }

    async listCustomer(req, res, next) {
        const customerList = await customerService.getAllCustomers();
        let customersResults = [];
        let updatedAt = new Date(2000, 1, 1);
        if (customerList.status) {
            for (const customer of customerList.data) {
                if (customer.updatedAt > updatedAt) {
                    updatedAt = customer.updatedAt;
                }
                const lastInvoice = await invoiceService.getRecentlyInvoice(customer._id);
                if (lastInvoice.status) {
                    customer.recentlyInvoice = lastInvoice.data;
                }
                else {
                    customer.recentlyInvoice = 0;
                }
                customersResults.push(customer);
            }
            customersResults.length = customerList.data.length;
        }
        res.render("pages/admin/listcustomer", { customers: customersResults, updatedAt: updatedAt })
    }

    async aboutCustomer(req, res, next) {
        const customerId = req.params.customerId;
        // console.log(merchandiseId)
        const result = await customerService.getCustomerById(customerId);
        // console.log(result);
        if (result.status) {
            const customer = result.data;
            let totalInvoice = 0;
            let totalAmount = 0;
            let totalDiscount = 0;
            let totalPaid = 0;
            const invoicesData = await invoiceService.getAllInvoicesByCustomerId(customer._id);
            if (invoicesData.status) {
                totalInvoice = invoicesData.data.length;
                // let invoiceDetailsList = [];
                for (const invoice of invoicesData.data) {
                    totalAmount += parseInt(invoice.totalAmount);
                    totalDiscount += parseInt(invoice.discount);
                    totalPaid += parseInt(invoice.totalAfterDiscount);
                    const invoiceDetails = await invoiceDetailService.getAllInvoiceDetailByInvoiceId(invoice._id);
                    if (invoiceDetails.status) {
                        invoice.invoiceDetails = invoiceDetails.data;
                        let totalProduct = 0;
                        for (const invoiceDetail of invoiceDetails.data) {
                            totalProduct += parseInt(invoiceDetail.quantity)
                            // console.log(invoiceDetail);
                            // const productData = await productService.getProductById(invoiceDetail.productId);
                            const merchandiseData = await merchandiseService.getMerchandiseById(invoiceDetail.merchandiseId);
                            if (merchandiseData.status) {
                                const productData = await productService.getProductById(merchandiseData.data.productId);
                                if (productData.status) {
                                    const merchandise = merchandiseData.data;
                                    merchandise.productName = productData.data.productName;
                                    invoiceDetail.product = merchandise;
                                }
                            }
                            // console.log(invoiceDetail)
                        }
                        invoice.totalProduct = totalProduct
                    }
                    const employeeData = await userService.getUserById(invoice.employeeId);
                    if (employeeData.status) {
                        invoice.employee = employeeData.data;
                    }
                }
                customer.invoicesList = invoicesData.data;
                customer.totalInvoice = totalInvoice
                customer.totalAmount = totalAmount
                customer.totalDiscount = totalDiscount
                customer.totalPaid = totalPaid
            }
            // console.log(customer)
            return res.render("pages/admin/aboutcustomer", { customer: customer });
        }
        return res.redirect("/notfound")
    }

    async listProducts(req, res, next) {
        const productsList = await productService.getAllProducts();
        let productsResult = [];
        let updatedAt = new Date(2000, 1, 1);
        if (productsList.status) {
            for (const product of productsList.data) {
                if (product.updatedAt > updatedAt) {
                    updatedAt = product.updatedAt;
                }
                const merchandise = await merchandiseService.getOneMerchandiseByProductId(product._id);
                product.merchandise = merchandise.data;
                product.createdAt = formatTimeInVietnamTimeZone(product.createdAt);
                productsResult.push(product);
            }
        }
        res.render("pages/admin/listproduct", { products: productsResult, updatedAt: updatedAt });
    }

    async listProductsById(req, res, next) {
        const productId = req.params.productId;
        const merchandisesList = await merchandiseService.getAllMerchandisesByProductId(productId);
        let merchandisesResults = [];
        let updatedAt = new Date(2000, 1, 1);
        const product = await productService.getProductById(productId);
        if (merchandisesList.status) {
            for (const merchandise of merchandisesList.data) {
                if (merchandise.updatedAt > updatedAt) {
                    updatedAt = merchandise.updatedAt;
                }
                merchandise.createdAt = formatTimeInVietnamTimeZone(merchandise.createdAt);
                merchandise.product = product.data;
                merchandisesResults.push(merchandise);
            }
        }
        res.render("pages/admin/listmerchandise", { merchandises: merchandisesResults, product: product.data, updatedAt: updatedAt });
    }


    async aboutProduct(req, res, next) {
        const merchandiseId = req.params.merchandiseId;
        // console.log(merchandiseId)
        const result = await merchandiseService.getMerchandiseById(merchandiseId);
        // console.log(result);
        if (result.status) {
            const merchandise = result.data;
            const productResult = await productService.getProductById(merchandise.productId)
            if (productResult.status) {
                merchandise.product = productResult.data;
            }
            return res.render("pages/admin/aboutproduct", { merchandise: merchandise });
        }
        return res.redirect("/notfound")
    }
    listStatistic(req, res) {
        res.render("pages/admin/statistic");
    }
    //API
    async listStatisticInvoices(req, res, next) {
        try {
            const invoicesData = await invoiceService.getAllInvoices();

            if (invoicesData.status) {
                const invoices = invoicesData.data;
                let totalInvoice = invoices.length;
                let totalSale = 0;
                let totalProfit = 0;
                let totalProduct = 0;
                let totalDiscount = 0;

                for (const invoice of invoices) {
                    totalDiscount += invoice.discount;
                    const invoiceDetails = await invoiceDetailService.getAllInvoiceDetailByInvoiceId(invoice._id);

                    if (invoiceDetails.status) {
                        invoice.createdAt = new Date(invoice.createdAt).toISOString().slice(0, 10);
                        invoice.invoiceDetails = invoiceDetails.data;
                        let totalProductInInvoice = 0;
                        let totalProfitInInvoice = 0;
                        let totalSaleInInvoice = 0;
                        let totalHistoryCost = 0;

                        for (const invoiceDetail of invoiceDetails.data) {
                            invoiceDetail.totalProduct = totalProductInInvoice;
                            invoiceDetail.totalProfitInInvoice = totalProfitInInvoice;
                            const merchandiseData = await merchandiseService.getMerchandiseById(invoiceDetail.merchandiseId);

                            if (merchandiseData.status) {
                                const productData = await productService.getProductById(merchandiseData.data.productId);

                                if (productData.status) {
                                    const merchandise = merchandiseData.data;
                                    merchandise.productName = productData.data.productName;
                                    invoiceDetail.product = merchandise;

                                    const quantity = parseInt(invoiceDetail.quantity);
                                    const importPrice = parseFloat(merchandise.importPrice);
                                    const retailPrice = parseFloat(merchandise.retailPrice);
                                    const profitPerProduct = (retailPrice - importPrice) * quantity;
                                    totalProfitInInvoice += profitPerProduct;
                                    totalProductInInvoice += parseInt(invoiceDetail.quantity);
                                    totalSaleInInvoice += retailPrice * quantity;
                                    totalHistoryCost += importPrice * quantity;
                                    invoiceDetail.profitPerProduct = profitPerProduct;
                                }
                            }
                            const customerData = await customerService.getCustomerById(invoice.customerId);
                            if (customerData.status) {
                                invoice.customer = customerData.data;
                            }
                            const employeeData = await userService.getUserById(invoice.employeeId);
                            if (employeeData.status) {
                                invoice.employee = employeeData.data;
                            }
                            invoice.totalInvoice = totalSaleInInvoice;
                            invoice.totalProductInvoice = totalProductInInvoice;
                            invoice.totalProfitInInvoice = totalProfitInInvoice;
                            invoice.totalHistoryCost = totalHistoryCost;
                        }
                        totalProfit += totalProfitInInvoice;
                        totalProduct += totalProductInInvoice;
                        totalSale += totalSaleInInvoice;

                        invoice.totalAllProfit = totalProfit - totalDiscount;
                        invoice.totalAllProduct = totalProduct;
                        invoice.totaAlllInvoice = totalInvoice;
                        invoice.totalAllSale = totalSale;
                    }
                }
                return res.status(200).json({ invoices: invoices });
            } else {
                return res.status(400).json({ message: invoicesData.message });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).send("Internal Server Error");
        }
    }//api
    //API
    async filterStatistic(req, res, next) {
        const { startDate, endDate } = req.body;
        try {
            const invoicesData = await invoiceService.getAllInvoices();

            if (invoicesData.status) {
                const invoices = invoicesData.data;
                let totalInvoice = 0;
                let totalSale = 0;
                let totalProfit = 0;
                let totalProduct = 0;
                let invoiceResult = [];
                let totalDiscount = 0;

                for (const invoice of invoices) {
                    totalDiscount += invoice.discount;
                    invoice.createdAt = new Date(invoice.createdAt).toISOString().slice(0, 10);
                    const invoiceDetails = await invoiceDetailService.getAllInvoiceDetailByInvoiceId(invoice._id);
                    if (invoiceDetails.status) {
                        invoice.invoiceDetails = invoiceDetails.data;
                        let totalProductInInvoice = 0;
                        let totalProfitInInvoice = 0;
                        let totalSaleInInvoice = 0;
                        let totalHistoryCost = 0;
                        for (const invoiceDetail of invoiceDetails.data) {
                            invoiceDetail.totalProduct = totalProductInInvoice;
                            invoiceDetail.totalProfitInInvoice = totalProfitInInvoice;

                            const merchandiseData = await merchandiseService.getMerchandiseById(invoiceDetail.merchandiseId);

                            if (merchandiseData.status) {
                                const productData = await productService.getProductById(merchandiseData.data.productId);

                                if (productData.status) {
                                    const merchandise = merchandiseData.data;
                                    merchandise.productName = productData.data.productName;
                                    invoiceDetail.product = merchandise;

                                    const quantity = parseInt(invoiceDetail.quantity);
                                    const importPrice = parseFloat(merchandise.importPrice);
                                    const retailPrice = parseFloat(merchandise.retailPrice);
                                    const profitPerProduct = (retailPrice - importPrice) * quantity;
                                    totalProfitInInvoice += profitPerProduct;
                                    totalProductInInvoice += parseInt(invoiceDetail.quantity);
                                    totalSaleInInvoice += retailPrice * quantity;
                                    totalHistoryCost += importPrice * quantity;
                                    invoiceDetail.profitPerProduct = profitPerProduct;
                                }
                            }
                            const customerData = await customerService.getCustomerById(invoice.customerId);
                            if (customerData.status) {
                                invoice.customer = customerData.data;
                            }
                            const employeeData = await userService.getUserById(invoice.employeeId);
                            if (employeeData.status) {
                                invoice.employee = employeeData.data;
                            }
                            invoice.totalInvoice = totalSaleInInvoice;
                            invoice.totalProductInvoice = totalProductInInvoice;
                            invoice.totalProfitInInvoice = totalProfitInInvoice;
                            invoice.totalHistoryCost = totalHistoryCost;
                        }
                        totalProfit += totalProfitInInvoice;
                        totalProduct += totalProductInInvoice;
                        totalSale += totalSaleInInvoice;

                        const invoiceDate = new Date(invoice.createdAt).toISOString().slice(0, 10);
                        if (invoiceDate >= startDate && invoiceDate <= endDate) {
                            invoiceResult.push(invoice);
                        }
                        else {
                            totalProfit -= totalProfitInInvoice;
                            totalProduct -= totalProductInInvoice;
                            totalSale -= totalSaleInInvoice;
                        }
                        invoice.totalAllProfit = totalProfit - totalDiscount;
                        invoice.totalAllProduct = totalProduct;
                        invoice.totaAlllInvoice = invoiceResult.length;
                        invoice.totalAllSale = totalSale;
                    }

                }
                return res.status(200).json({ invoices: invoiceResult });
            } else {
                return res.status(400).json({ message: invoicesData.message });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).send("Internal Server Error");
        }
    }//api


    async listMerchandises(req, res, next) {
        const merchandisesList = await merchandiseService.getAllMerchandises();
        let merchandisesResults = [];
        for (const merchandise of merchandisesList.data) {
            const product = await productService.getProductById(merchandise.productId);
            merchandise.createdAt = formatTimeInVietnamTimeZone(merchandise.createdAt);
            merchandise.product = product.data;
            merchandisesResults.push(merchandise);
        }

        res.render("pages/admin/listmerchandise", { merchandises: merchandisesResults });
    }
}

module.exports = new AdminController;