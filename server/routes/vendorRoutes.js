// vendorRoutes.js
const { Router } = require('express');

const {
    registerUser,
    loginUser,
    getUser,
    changeAvatar,
    editUser,
    getVendors
} = require('../controllers/vendorController.js');
const authMiddleware = require('../middlewares/authMiddleware.js')

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/:id', getUser);  // Assuming this is for getting a specific user by ID
router.get('/', getVendors);  // Assuming this is for getting all vendors
router.post('/change-avatar', authMiddleware, changeAvatar);
router.patch('/edit-user', authMiddleware, editUser);

module.exports = router;
