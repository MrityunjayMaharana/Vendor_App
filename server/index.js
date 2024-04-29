const express = require('express')
const cors = require('cors');
const {connect} = require('mongoose')
const upload = require('express-fileupload')

require('dotenv').config()

const vendorRoutes = require('./routes/vendorRoutes')
const productRoutes = require('./routes/productRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express()

app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))
app.use(cors({credentials: true, origin: "http://localhost:3000"}))
app.use(upload())
app.use('/uploads', express.static(__dirname+ '/uploads'))

app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);

app.use(notFound)
app.use(errorHandler)

connect(process.env.MONGO_URI).then(
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running at: http://localhost:${process.env.PORT}`);
    })
).catch(error => {
    console.log(error)
})
