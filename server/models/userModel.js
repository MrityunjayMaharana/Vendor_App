const {Schema, model} = require('mongoose')

const userSchema = new Schema({
    name: {type: String, required: true},
    thumbnail: {type: String},
    email: {type: String, required: true},
    shopName: {type: String, required: true},
    password: {type: String, required: true},
    location: {type: String, required: true},
    contact: {type: Number, required: true},
    avatar: {type: String},
    products: {type: Number, default: 0},
})

module.exports = model('User', userSchema)