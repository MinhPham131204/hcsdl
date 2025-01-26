const express = require('express')
const router = express.Router()

const controller = require('../controller/order/list')

router.get('/list', controller.getList)
router.get('/:id', controller.detail)
// router.delete('/remove_model/:id', controller.removeModel)

module.exports = router