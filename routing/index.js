const product = require('./product')
const discount = require('./discount')
const order = require('./order')
const login = require('./login')

function requireLogin(req, res, next) {
    if (req.cookies.sellerID) {
        next();
    }

    else res.redirect('/')
}


function route(app) {
    app.use('/seller/product', requireLogin, product)
    app.use('/seller/discount', requireLogin, discount)
    app.use('/seller/order', requireLogin, order)
    app.use('', login)
}

module.exports = route