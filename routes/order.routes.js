const express = require('express');
const Order = require('../models/order.models');
const Product = require('../models/product.models');
const User = require('../models/user.models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/place', verifyToken, async (req, res) => {
    try {
        const { products } = req.body;
        const user = await User.findById(req.user.id);
        let totalAmount = 0;

        for (const item of products) {
            const product = await Product.findById(item.productId);
            totalAmount += product.price * item.quantity;
        }

        const order = new Order({ user: user._id, products, totalAmount });
        await order.save();
        res.status(201).send('Order placed');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/user-orders', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('products.productId');
        res.send(orders);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


module.exports = router;
