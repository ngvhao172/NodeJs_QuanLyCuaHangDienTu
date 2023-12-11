const {mongooseToObject} = require('../utils/convertMongoose')
const {multipleMongooseToObject} = require('../utils/convertMongoose')
const Product = require('../models/Product');
const merchandiseService = require('./MerchandiseService');

class ProductService{
    async getAllProducts(){
        return await Product.find({})
            .then((products) => {
                if (products) {
                    return { status: true, data: multipleMongooseToObject(products)};
                }else {
                    return { status: false, message: 'Products not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async getUserByName(productName) {
        return await Product.findOne({ productName: productName })
            .then((product) => {
                if (product) {
                    return { status: true, data: mongooseToObject(product) };
                } else {
                    return { status: false, message: 'Product not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    
    async getProductById(productId) {
        return await Product.findById(productId)
            .then((product) => {
                if (product) {
                    return { status: true, data: mongooseToObject(product) };
                } else {
                    return { status: false, message: 'Product not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    
    async createProduct(newProduct) {
        try {
          const result = await newProduct.save();
          return { status: true, data: mongooseToObject(result) };
        } catch (error) {
          return { status: false, message: error.message };
        }
    }   
    async deleteProduct(productId) {
        try {
          const productToDelete = await Product.findByIdAndDelete(productId);
      
          if (!productToDelete) {
            return { status: false, message: "Product not found" };
          }
      
          return { status: true, data: mongooseToObject(productToDelete) };
        } catch (error) {
          return { status: false, message: error.message };
        }
    }
    async updateProduct(product){
        try {
            const updateProduct = await Product.findByIdAndUpdate({_id: product._id}, product);
            return { status: true, data: mongooseToObject(updateProduct) };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
    async getProductsByFilter(filters){
        try {
            const products = await Product.find(filters);
        
            if (products.length > 0) {
              return { status: true, data: multipleMongooseToObject(products) };
            } else {
              return { status: false, message: 'Products not found' };
            }
          } catch (error) {
            return { status: false, message: error.message };
          }
    }  
    async getAllQuantityOfProduct(productId) {
        try {
            const merchandises = await merchandiseService.getAllMerchandisesByProductId(productId);
    
            if (merchandises.status) {
                let quantity = 0;
    
                if (Array.isArray(merchandises.data)) {
                    for (const merchandise of merchandises.data) {
                        quantity += merchandise.quantity;
                    }
                } else {
                    return { status: false, message: "Unexpected data structure" };
                }
    
                return { status: true, data: quantity };
            } else {
                return { status: true, data: 0 };
            }
    
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
    
}

module.exports = new ProductService;