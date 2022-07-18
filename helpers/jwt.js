const expressJwt = require('express-jwt');

function authJwt(){
    const secret = process.env.secret;
    
    return expressJwt({ 
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [
            {url: /\/api\/v1\/uploads(.*)/ , methods: ['GET', 'OPTIONS'] },  
            {url: /\/api\/v1\/products(.*)/ , methods: ['GET', 'OPTIONS'] },  
            {url: /\/api\/v1\/categories(.*)/ , methods: ['GET', 'OPTIONS'] },  
            {url: /\/api\/v1\/orders(.*)/ , methods: ['POST', 'OPTIONS'] },
            '/api/v1/users/login',
            '/api/v1/users/register',
           {url: /(.*)/},
        ]
    })
}
//to classify the roles admin or not
async function isRevoked(req, payload, done) {
    if (!payload.isAdmin){
        done(null, true)
    }

    done();
}

module.exports = authJwt;