const express = require('express')
const router = express.Router()

const validate = require('../controller/login/validate')

router.get('/', validate.loginUI)
router.post('/seller/validate', validate.verify)
router.get('/logout', validate.logout)
router.get('/forgotPassword', validate.yourEmail)
router.post('/verifyEmail', validate.verifyEmail)
router.get('/getOTP', validate.yourOTP)
router.post('/checkOTP', validate.verifyOTP)
router.get('/createNewPassword', validate.createNewPassword)
router.put('/resetPassword', validate.resetPassword)

module.exports = router