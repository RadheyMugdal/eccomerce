const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userRoutes = require('../routes/user.routes');
const orderRoutes = require('../routes/order.routes');
const dbConnect = require('../utils/dbConnect');

const app = express();
app.use(bodyParser.json());

dbConnect()

app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
