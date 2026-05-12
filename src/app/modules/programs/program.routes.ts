import { Router } from 'express';
import {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  uploadCoverImage,
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
import { fileUploader } from '../../helpers/fileUploader';
import auth from '../../middlewares/auth';

const router = Router();

// POST /programs/create - Create a new program with optional file upload
router.post('/create', auth(), fileUploader.upload.single('coverImage'), validateRequest(createProgramValidation), createProgram);

// GET /programs/all - Get all programs with pagination, search, and filters
router.get('/all', auth(), getAllPrograms);

// GET /programs/by-id/:id - Get a specific program by ID
router.get('/by-id/:id', getProgramById);

// PUT /programs/update/:id - Update a program with optional file upload
router.put('/update/:id', auth(), fileUploader.upload.single('coverImage'), validateRequest(updateProgramValidation), updateProgram);

// POST /programs/:id/upload-cover - Upload cover image for a program
router.post('/:id/upload-cover', auth(), fileUploader.upload.single('coverImage'), uploadCoverImage);

// DELETE /programs/delete/:id - Delete a program
router.delete('/delete/:id', auth(), validateRequest(deleteProgramValidation), deleteProgram);

export const programRoutes = router;
