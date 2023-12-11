module.exports = {
    multipleMongooseToObject: (mongooses) => {
        return mongooses.map(mongoose => mongoose.toObject());
    },
    mongooseToObject: (mongoose) => {
        try{
            return mongoose ? mongoose.toObject() : mongoose;
        }
        catch(e){
            return mongoose;
        }     
    } 
}