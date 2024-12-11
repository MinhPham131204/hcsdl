const product = require('./product')

function route(app) {
    app.use('/seller/product', product)
}

module.exports = route