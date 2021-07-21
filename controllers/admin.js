const Order = require('../models/order');


exports.getAdminOrders = (req, res, next) => {
    Order.find({ status: { $ne: 'completed' } }, null, { sort: { 'createdAt': -1 } })
        .populate('customerId', '-password')
        .exec((err, orders) => {
            if (req.xhr) {
                return res.json(orders)
            }
            return res.render('admin/orders')
        })
}

exports.postOrderStatus = (req, res, next) => {
    const orderId = req.body.orderId;
    const status = req.body.status;

    Order.updateOne({ _id: orderId }, { status: status }, (err, data) => {
        if (err) {
            return res.redirect('/admin/orders')
        }

        // emit events
        const eventEmitter = req.app.get('eventEmitter');
        eventEmitter.emit('orderUpdated', { id: orderId, status: status })


        return res.redirect('/admin/orders')
    })
}