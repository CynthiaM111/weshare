const express = require('express');
const router = express.Router();
const destinationCategoryController = require('../controllers/destinationCategoryController');
const authController = require('../controllers/authController');

router.post('/destinations', authController.protect, destinationCategoryController.createCategory);
router.get('/destinations', authController.protect, destinationCategoryController.getCategories);
router.get('/destinations/agency/:agencyId', destinationCategoryController.getCategoriesByAgency);
router.put('/destinations/:id', authController.protect, destinationCategoryController.updateCategory);
router.delete('/destinations/:id', authController.protect, destinationCategoryController.deleteCategory);

module.exports = router;