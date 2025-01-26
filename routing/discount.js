const express = require('express')
const router = express.Router()

const create = require('../controller/discount/create')

router.get('/create', create.getUI)

module.exports = router