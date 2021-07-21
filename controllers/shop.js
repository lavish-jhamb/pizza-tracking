const moment = require('moment')

const Menu = require('../models/menu');
const order = require('../models/order');
const Order = require('../models/order');

exports.getIndex = (req, res, next) => {
    Menu.find()
        .then(menus => {

            res.render('home', {
                menus: menus,
            })

        })
        .catch(err => {
            console.log(err)
        })
}

exports.getCart = (req, res, next) => {
    res.render('cart',
        {
            errorMessage: req.flash('error')
        })
}

exports.postUpdateCart = (req, res, next) => {

    // let cart = {
    //     items: {
    //         pizzaId: { item: pizzaObject, qty:0 },
    //         pizzaId: { item: pizzaObject, qty:0 },
    //         pizzaId: { item: pizzaObject, qty:0 },
    //     },
    //     totalQty: 0,
    //     totalPrice: 0
    // }
    // for the first time creating cart and adding basic object structure
    if (!req.session.cart) {
        req.session.cart = {
            items: {},
            totalQty: 0,
            totalPrice: 0
        }
    }
    let cart = req.session.cart

    // Check if item does not exist in cart 
    if (!cart.items[req.body._id]) {
        cart.items[req.body._id] = {
            item: req.body,
            qty: 1
        }
        cart.totalQty = cart.totalQty + 1
        cart.totalPrice = cart.totalPrice + req.body.price
    } else {
        cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1
        cart.totalQty = cart.totalQty + 1
        cart.totalPrice = cart.totalPrice + req.body.price
    }
    return res.json({ totalQty: req.session.cart.totalQty })

}

exports.getOrder = async (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login')
    }
    const orders = await Order.find({ customerId: req.user._id }, null, { sort: { 'createdAt': -1 } });
    res.setHeader('Cache-Control', 'no-cache,private,no-store,must-revalidate, max-stale=0,post-check=0 , pre-check=0')
    res.render('orders', { orders: orders, createdAt: moment().format('hh:mm: a') })
}

exports.postOrders = (req, res, next) => {
    const phone = req.body.phone;
    const address = req.body.address;

    // VALIDATE
    if (!phone || !address) {
        req.flash('error', 'all field are required')
        return res.redirect('/cart')
    }

    const order = new Order({
        customerId: req.user._id,
        items: req.session.cart.items,
        phone: phone,
        address: address
    })

    order.save()
        .then(result => {
            Order.populate(result, { path: 'customerId' }, (err, placedOrder) => {
                if (!err) {
                    req.flash('success', 'Order Placed Successfully');
                    delete req.session.cart;
                    // Emit 
                    const eventEmitter = req.app.get('eventEmitter')
                    eventEmitter.emit('orderPlaced', placedOrder)
                    return res.redirect('/customer/orders')
                }
            })
        }).catch(err => {
            req.flash('error', 'something went wrong')
            console.log(err)
        })
}

exports.getSingleOrder = (req, res, next) => {
    const orderId = req.params.id;
    Order.findById(orderId)
        .then(singleOrder => {
            // console.log(singleOrder._id)
            // AUTH USER
            if (req.user._id.toString() === singleOrder.customerId.toString()) {
                return res.render('singleOrder', { order: singleOrder })
            }
            return res.redirect('/customer/orders')
        })
        .catch(err => {
            console.log(err)
        })
}
