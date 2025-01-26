const express = require('express')
const router = express.Router()
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const create = require('../controller/product/create')
const edit = require('../controller/product/edit')
const list = require('../controller/product/list')

router.get('/create', create.getUI)
router.post('/store', 
    upload.fields([
      { name: 'image', maxCount: 5 }, // Tối đa 5 file cho trường 'image'
      { name: 'model_img', maxCount: 10 } 
    ]), 
    create.insertProduct
  );
// router.post('/store_no_model', upload.single('image'), controller.insert)
router.get('/list', list.showList)
router.get('/search', list.search)
router.get('/:id/edit', edit.getUI)
router.put('/:id', upload.single('image'), edit.update);
router.delete('/remove/:id', list.remove)
// router.delete('/remove_model/:id', controller.removeModel)

module.exports = router
    