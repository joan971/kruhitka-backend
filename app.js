//constante permettant de bénéficier des librairies installées
const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

app.use(cors());
app.options('*', cors())

//sert à lire le dossier de la variable d'environnement
require('dotenv/config');

const api = process.env.API_URL;



//ProductsRouter nous permet de voir le fichier products.js
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');

//Middleware(fonction qui rendra nos données compréhensible pour express qu'on envoit depuis la partie front)
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

app.use((err, req, res, next) => {
    if (err === 'UnauthorizedError') {
        //_jwt authentication error
        return res.status(401).json({ message: "The user is not authorized" })
    }
    if (err === 'ValidationError') {
        //validation error
        return res.status(401).json({ message: err })
    }

    //default error
    return res.status(500).json(err)
})

//Routes
app.use(`${api}/categories`, categoriesRoutes)
app.use(`${api}/products`, productsRoutes)
app.use(`${api}/users`, usersRoutes)
app.use(`${api}/orders`, ordersRoutes)


//Connection à notre base de données
mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log('Database Connection is established')
    })
    .catch((err) => {
        console.log(err);
    })


//adresse du serveur en utilisant express
app.listen(3000, () => {

    console.log('server is running on http://localhost:3000');
})

