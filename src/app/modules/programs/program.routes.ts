import { Router } from 'express';
import {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
} from './program.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createProgramValidation,
  getProgramValidation,
  getProgramsValidation,
  updateProgramValidation,
  deleteProgramValidation,
} from './program.validation';

const router = Router();

// POST /programs - Create a new program
router.post('/create', validateRequest(createProgramValidation), createProgram);

// GET /programs - Get all programs with pagination, search, and filters
router.get('/all', validateRequest(getProgramsValidation), getAllPrograms);

// GET /programs/:id - Get a specific program by ID
router.get('/by-id/:id', validateRequest(getProgramValidation), getProgramById);

// PUT /programs/:id - Update a program
router.put('/update/:id', validateRequest(updateProgramValidation), updateProgram);

// DELETE /programs/:id - Delete a program
router.delete('/delete/:id', validateRequest(deleteProgramValidation), deleteProgram);

export const programRoutes = router;
