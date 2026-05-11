import { Router } from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from './category.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createCategoryValidation,
  getCategoryValidation,
  getCategoriesValidation,
  updateCategoryValidation,
  deleteCategoryValidation,
} from './category.validation';

const router = Router();

// POST /categories - Create a new category
router.post('/create', validateRequest(createCategoryValidation), createCategory);

// GET /categories - Get all categories with pagination and search
router.get('/all', validateRequest(getCategoriesValidation), getAllCategories);

// GET /categories/:id - Get a specific category by ID
router.get('/by-id/:id', validateRequest(getCategoryValidation), getCategoryById);

// PUT /categories/:id - Update a category
router.put('/update/:id', validateRequest(updateCategoryValidation), updateCategory);

// DELETE /categories/:id - Delete a category
router.delete('/delete/:id', validateRequest(deleteCategoryValidation), deleteCategory);

export const categoryRoutes = router;
