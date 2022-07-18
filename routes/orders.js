//constante permettant de bénéficier des librairies installées
const express = require('express');
const router = express.Router();
const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');
const { Product } = require('../models/product');
const stripe = require('stripe')('sk_test_51IUDnGKAfI2qPdhftfHcu2XTdMh7vUuXilzEyaQepUks0glqgjKqwFFfq2M7yaEgbJGR3ORtnwkE8OU0vXpGdat400PnHkEZit');

//route api
//la methode get retourne une promise. afin d'éviter les errors utiliser await et async.(la BDD retourne la reponse quand la liste est prête)
router.get(`/`, async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort({ dateOrdered: -1 });
    res.send(orderList);
})


router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'category',
            },
        });

    if (!order) {
        res.status(500).json({ success: false })
    }
    res.send(order);
})

//method POST
router.post('/', async (req, res) => {

    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderitem) => {

        let newOrderItem = new OrderItem({
            quantity: orderitem.quantity,
            product: orderitem.product
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }))

    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate("product", "price");
        const totalPrice = orderItem.product.price * orderItem.quantity;

        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);


    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    })

    order = await order.save();

    if (!order)
        return res.status(400).send('The order cannot be created!')

    res.send(order);
})

//method checkout session
router.post('/create-checkout-session', async (req, res) => {
    const orderItems = req.body;
    if (!orderItems) {
        return res.status(400).send('Checkout session cannot be created - please check the order items');
    }

    const lineItems = await Promise.all(
        orderItems.map(async (orderItem) => {
            const product = await Product.findById(orderItem.product);
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                    },
                    unit_amount: product.price * 100,
                },
                quantity: orderItem.quantity
            };
        })
    );

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: 'http://localhost:4200/success',
        cancel_url: 'http://localhost:4200/error'
    })
    res.json({ id: session.id })
})

//method PUT
router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        //pour avoir l'update en reponse sur postman
        { new: true }
    )

    if (!order)
        return res.status(400).send('The order cannot be updated!')

    res.send(order);
})

//method DELETE and also delete the orderItems
router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({ success: true, message: 'The order is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "Order not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

//method pour compter le montant total des commandes
router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ])

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({ totalSales: totalSales.pop().totalsales })
})

//method GET pour compter le nbre de commande
router.get(`/get/count`, async (req, res) => {

    const orderCount = await Order.countDocuments()

    res.send({
        orderCount: orderCount
    });
})

//method pour compter le nbre de commande par user
router.get(`/get/userorders/:userid`, async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userid }).populate({
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'
        }
    }).sort({ 'dateOrdered': -1 });

    if (!userOrderList) {
        res.status(500).json({ success: false });
      }
    res.send(userOrderList);
})
//exporter le router
module.exports = router;