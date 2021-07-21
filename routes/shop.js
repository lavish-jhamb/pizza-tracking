const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop');

const isAuth = require('../middleware/is-auth');

router.get('/', shopController.getIndex);

router.get('/cart', shopController.getCart);

router.post('/update-cart', isAuth, shopController.postUpdateCart);

router.get('/customer/orders', isAuth, shopController.getOrder);

router.post('/orders', isAuth, shopController.postOrders);

router.get('/customer/orders/:id', isAuth, shopController.getSingleOrder)

module.exports = router;