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

export const  compile=async (req,res)=>{
    const {code}=req.body
    var hackerEarth=new hackerEarth("7c65a588bff92c18efd377e02a82d9779ca914b9");
    var config={};
    config.time_limit=1;  //your time limit in integer
    config.memory_limit=323244;  //your memory limit in integer
    config.source=code;  //your source code for which you want to use hackerEarth api
    config.input="";  //input against which you have to test your source code
    config.language="py"; //optional choose any one of them or none
    hackerEarth.compile(config,function(err,result){
        if(err){
            return res.status(500).json({
                success:false,
                massage:err,
                status:500
            })
        }
        res.status(200).json({
            success:true,
            data:result,
            status:200
        })
        
    })
    return res.status(200).json({
        success:true,
        data:result,
        status:200
    })
}

router.post('/compile',compile)


module.exports = router;
