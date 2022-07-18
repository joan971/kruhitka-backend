//constante permettant de bénéficier des librairies installées
const express = require('express');
const router = express.Router();

const { Product } = require('../models/product');
const mongoose = require('mongoose');
const { status } = require('express/lib/response');
const { Category } = require('../models/category');
const multer = require('multer');

//to accept only format png and jpeg files
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'

};

//to upload images for our project(multer library)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null
        }

        cb(uploadError, 'public/uploads')
    },

    filename: function (req, file, cb) {

        const fileName = file.originalname.split('').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];

        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage });

//route api
//la methode get retourne une promise. afin d'éviter les errors utiliser await et async.(la BDD retourne la reponse quand la liste est prête)

//method GET ALL
router.get(`/`, async (req, res) => {

    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') }
    }
    const productList = await Product.find(filter);

    if (!productList) {
        res.status(500).json({ success: false })
    }
    res.send(productList);
})

//Method GET BY ID
router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(500).json({ success: false })
    }
    res.send(product);
})

//method POST
router.post(`/`, uploadOptions.single('image'), async (req, res) => {

    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');
    
    const fileName = req.file.filename;

    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`, //"http://localhost:3000/public/uploads/image-21212"
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })

    product = await product.save();

    if (!product)
        return res.status(500).send('The product cannot be created')

    res.send(product);
});

//method PUT
router.put('/:id', uploadOptions.single('image'), async (req, res) => {

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid product');

    const file = req.file;
    let imagepath;

    if(file){
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath: `${basePath}${fileName}`;
    }else{
        imagepath = product.image;
    }

    const updateProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        { new: true }
    )

    if (!updateProduct)
        return res.status(500).send('the product cannot be updated!')

    res.send(updateProduct);
})

//method DELETE
router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product => {
        if (product) {
            return res.status(200).json({ success: true, message: 'the product is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "product not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})


//method GET pour compter le nbre de product
router.get(`/get/count`, async (req, res) => {

    const productCount = await Product.countDocuments()

    if (!productCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        productCount: productCount
    });
})

//method GET pour nos features
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({ isFeatured: true });

    if (!products) {
        res.status(500).json({ success: false })
    }
    res.send(products);
})

//method PUT for uploading images
router.put('/gallery-images/:id', uploadOptions.array('images'), async (req, res) => {

    const files = req.files
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    if (files) {
        files.map((file) => {
           
            imagesPaths.push(`${basePath}${file.fileName}`);
        })
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        { new: true }
    )

    if (!product)
        return res.status(500).send('the gallery  cannot be updated!')

    res.send(product);
})
//exporter le router
module.exports = router;
