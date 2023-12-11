const {mongooseToObject} = require('../utils/convertMongoose')
const {multipleMongooseToObject} = require('../utils/convertMongoose')
const Merchandise = require('../models/Merchandise');

class MerchandiseService{
    async getAllMerchandises(){
        return await Merchandise.find({})
            .then((merchandises) => {
                if (merchandises) {
                    return { status: true, data: multipleMongooseToObject(merchandises)};
                }else {
                    return { status: false, message: 'Merchandises not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async getMerchandiseById(merchandiseId) {
        return await Merchandise.findById(merchandiseId)
            .then((merchandise) => {
                if (merchandise) {
                    return { status: true, data: mongooseToObject(merchandise) };
                } else {
                    return { status: false, message: 'Merchandise not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async getOneMerchandiseByProductId(productId) {
        return await Merchandise.findOne({productId: productId}).sort({ price: 1 }) //sản phẩm có giá thấp nhất
            .then((merchandise) => {
                if (merchandise) {
                    return { status: true, data: mongooseToObject(merchandise) };
                } else {
                    return { status: false, message: 'Merchandise not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async getOneMerchandiseByProductIdFilterPrice(productId, filter) {
        if(!filter){{
            filter = {$gt: 0}
        }}
        return await Merchandise.findOne({productId: productId, retailPrice: filter} ).sort({ price: 1 }) //sản phẩm có giá thấp nhất
            .then((merchandise) => {
                if (merchandise) {
                    return { status: true, data: mongooseToObject(merchandise) };
                } else {
                    return { status: false, message: 'Merchandise not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async getAllMerchandisesByProductId(productId){
        return await Merchandise.find({productId: productId})
            .then((merchandise) => {
                if (merchandise) {
                    return { status: true, data: multipleMongooseToObject(merchandise) };
                } else {
                    return { status: false, message: 'Merchandises not found' };
                }
            })
            .catch((error) => {
                return { status: false, message: error.message };
            });
    }
    async createMerchandise(newMerchandise) {
        try {
          const result = await newMerchandise.save();
          return { status: true, data: mongooseToObject(result) };
        } catch (error) {
          return { status: false, message: error.message };
        }
    }   
    async deleteMerchandise(merchandiseId) {
        try {
          const merchandiseToDelete = await Merchandise.findByIdAndDelete(merchandiseId);
      
          if (!merchandiseToDelete) {
            return { status: false, message: "Merchandise not found" };
          }
      
          return { status: true, data: mongooseToObject(merchandiseToDelete) };
        } catch (error) {
          return { status: false, message: error.message };
        }
      } 
    async updateMerchandise(merchandise){
        console.log(merchandise)
        try {
            const updateMerchandise = await Merchandise.findByIdAndUpdate({_id: merchandise._id}, merchandise);
            return { status: true, data: mongooseToObject(updateMerchandise) };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
    async getMerchandisesByIdAndFilter(productIdValue, filters) {
        try {
            const merchandises = await Merchandise.find({ productId: productIdValue, ...filters });
    
            if (merchandises.length > 0) {
                return { status: true, data: multipleMongooseToObject(merchandises) };
            } else {
                return { status: false, message: 'Merchandises not found' };
            }
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
    
}

module.exports = new MerchandiseService;