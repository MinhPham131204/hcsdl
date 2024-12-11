const express = require('express')
const router = express.Router()
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const controller = require('../controller/product')

router.get('/create', controller.create)
router.post('/store', 
    upload.fields([
      { name: 'image', maxCount: 5 }, // Tối đa 5 file cho trường 'image'
      { name: 'model_img', maxCount: 10 } 
    ]), 
    controller.insertProduct
  );
router.post('/store_no_model', upload.single('image'), controller.insert)
router.get('/list', controller.showList)
router.get('/search', controller.search)
router.get('/:id/edit', controller.edit)
router.put('/:id', controller.update);
router.delete('/remove/:id', controller.remove)
// router.delete('/remove_model/:id', controller.removeModel)

module.exports = router
    