const express = require('express');
const Order = require('../models/order.models');

const router = express.Router();

router.get('/user-product-orders', async (req, res) => {
    try {
        const orders = await Order.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: { user: "$user", product: "$products.productId" },
                    totalQuantity: { $sum: "$products.quantity" },
                    totalValue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            }
        ]);
        res.send(orders);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/weekly-orders-q1-2024', async (req, res) => {
    try {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-03-31');

        const weeklyOrders = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { $week: "$orderDate" },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);
        res.send(weeklyOrders);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


router.get('/popular-products', async (req, res) => {
    try {
        const popularProducts = await Order.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.productId",
                    orderCount: { $sum: 1 }
                }
            },
            { $match: { orderCount: { $gte: 5 } } },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    productName: "$productDetails.name",
                    orderCount: 1
                }
            }
        ]);
        res.send(popularProducts);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;

