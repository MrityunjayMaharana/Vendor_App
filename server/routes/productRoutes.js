const { Router } = require('express');
const {
    createProduct,
    getProducts,
    getProduct,
    getCatProducts,
    getVendorProducts,
    editProduct,
    deleteProduct
} = require('../controllers/productController')
const authMiddleware = require('../middlewares/authMiddleware')
const router = Router()

router.post('/', authMiddleware, createProduct)
router.get('/', getProducts)
router.get('/:id', getProduct)
router.get('/cateogories/:cateogory', getCatProducts)
router.get('/vendors/:id', getVendorProducts)
router.patch('/:id', authMiddleware, editProduct)
router.delete('/:id', authMiddleware, deleteProduct)

module.exports = router