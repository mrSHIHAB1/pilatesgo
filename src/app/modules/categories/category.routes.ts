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
  updateCategoryValidation,
  deleteCategoryValidation,
} from './category.validation';
import auth from '../../middlewares/auth';
import { checkSubscription } from '../../middlewares/checkSubscription';

const router = Router();

// POST /categories - Create a new category
router.post('/create', auth(), validateRequest(createCategoryValidation), createCategory);

// GET /categories - Get all categories with pagination and search
router.get('/all', auth(),  getAllCategories);

// GET /categories/:id - Get a specific category by ID
router.get('/by-id/:id', auth(),  getCategoryById);

// PUT /categories/:id - Update a category
router.put('/update/:id', auth(), validateRequest(updateCategoryValidation), updateCategory);

// DELETE /categories/:id - Delete a category
router.delete('/delete/:id', auth(), validateRequest(deleteCategoryValidation), deleteCategory);

export const categoryRoutes = router;
