const express = require('express')
const router = express.Router()

const validate = require('../controller/login/validate')

router.get('/', validate.loginUI)
router.post('/seller/validate', validate.verify)
router.get('/seller/main', validate.mainPage)
router.get('/logout', validate.logout)

module.exports = router