function errorHandler(err, req, res, next) {
    if (err === 'UnauthorizedError') {
        //_jwt authentication error
        return res.status(401).json({message: "The user is not authorized"})
    }
    if (err === 'ValidationError') {
        //validation error
        return res.status(401).json({message: err})
    }

    //default error
    return res.status(500).json(err)
}