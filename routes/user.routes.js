const express = require('express');
const jwt = require('jsonwebtoken');
const Blacklist = require('../models/blacklist.models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, phoneNumber, address } = req.body;
        const user = new User({ username, email, password, phoneNumber, address });
        await user.save();
        res.status(201).send('User created');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).send('Invalid credentials');
        }
        const token = jwt.sign({ id: user._id }, 'secretkey');
        res.send({ token });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/logout', verifyToken, async (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decodedToken = jwt.decode(token);

        const expiryDate = new Date(decodedToken.exp * 1000);
        const blacklistedToken = new Blacklist({ token, expiryDate });
        await blacklistedToken.save();

        res.send('Logged out successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
});


router.post('/checkout', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.productId');
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.cart.length === 0) {
            return res.status(400).send('Cart is empty');
        }

        let totalAmount = 0;
        const products = [];

        for (const item of user.cart) {
            const product = item.productId;
            if (!product) {
                return res.status(400).send('Product not found in cart');
            }

            if (product.stock < item.quantity) {
                return res.status(400).send(`Not enough stock for ${product.name}`);
            }

            product.stock -= item.quantity;
            await product.save();

            totalAmount += product.price * item.quantity;
            products.push({
                productId: product._id,
                quantity: item.quantity
            });
        }

        const order = new Order({
            user: user._id,
            products,
            totalAmount
        });

        await order.save();

        user.cart = [];
        await user.save();

        res.status(201).send('Checkout successful and order placed');
    } catch (error) {
        res.status(500).send(error.message);
    }
});


module.exports = router;
