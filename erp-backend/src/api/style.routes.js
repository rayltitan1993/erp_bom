const express = require('express');
const router = express.Router();
const { 
  createStyle, 
  getStyles, 
  getStyleById,
  updateStyle, 
  deleteStyle 
} = require('../controllers/style.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.route('/')
  .get(getStyles)
  .post(createStyle);

router.route('/:id')
  .get(getStyleById)
  .put(updateStyle)
  .delete(deleteStyle);

module.exports = router;