const mongoose = require('mongoose');

//schema de nos tables
const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    icon: {
        type: String,
    },
    color: {
        type: String,
    },
    
})

categorySchema.virtual('id').get(function(){
    return this._id.toHexString();
});

categorySchema.set('toJSON', {
    virtuals: true
});
//model 
//en utilisant 'export'notre const est visible par tous les autres fichiers
exports.Category = mongoose.model('Category', categorySchema);