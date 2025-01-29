const product = require('./product')
const discount = require('./discount')
const order = require('./order')
const login = require('./login');
const { verifyToken } = require('../middleware/auth');

function requireLogin(req, res, next) {
    if (req.cookies.token) {
        next();
    }

    else res.redirect('/')
}

function route(app) {
    app.use('', login)
    app.use('/seller', requireLogin, verifyToken, product)
    app.use('/seller/discount', requireLogin, verifyToken, discount)
    app.use('/seller/order', requireLogin, verifyToken, order)
}

module.exports = route