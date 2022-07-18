const mongoose = require('mongoose');

//schema de nos tables
const orderItemSchema = mongoose.Schema({
    
   quantity: {
       type: Number, 
       required: true
   },
   product: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Product'
   }
    
})

//model 
//en utilisant 'export'notre const est visible par tous les autres fichiers
exports.OrderItem = mongoose.model('OrderItem', orderItemSchema);