const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin');

const adminProtection = require('../middleware/admin');


router.get('/admin/orders', adminProtection, adminController.getAdminOrders)

router.post('/admin/order/status', adminProtection, adminController.postOrderStatus)


module.exports = router;