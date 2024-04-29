const {Schema, model} = require('mongoose')

const productSchema = new Schema({
    productName: {type: String, required: true},
    cateogory: {type: String, enum: ['Gadget', 'Electronic', 'Stationary', 'Groceries', 'Gift', 'Accessories', 'Game', 'Fashion'], message: "{Value is not supported}"},
    decription: {type: String, required: true},
    password: {type: String, required: true},
    thumbnail: {type: String, required: true},
    price: {type: Number, required: true},
    vendor: {type: Schema.Types.ObjectId, ref: "User"},
    shopName: {type: Schema.Types.ObjectId, ref: "User"},
    contact: {type: Schema.Types.ObjectId, ref: "User"},
}, {timestamps: true})

module.exports = model('Product', productSchema)