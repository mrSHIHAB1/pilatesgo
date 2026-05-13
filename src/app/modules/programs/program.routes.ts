import { Router } from 'express';
import {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  uploadCoverImage,
  deleteProgram,
} from './program.controller';
import {
  activateProgramForMe,
  getMyActivePrograms,
  getMyProgramProgress,
  setExerciseDoneForMe,
} from './program.progress.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createProgramValidation,
  getProgramValidation,
  getProgramsValidation,
  updateProgramValidation,
  deleteProgramValidation,
  activateProgramValidation,
  getProgramProgressValidation,
  setExerciseDoneValidation,
} from './program.validation';
import { fileUploader } from '../../helpers/fileUploader';
import auth from '../../middlewares/auth';

const router = Router();


router.post('/create', auth(), fileUploader.upload.single('coverImage'), validateRequest(createProgramValidation), createProgram);
router.get('/all', auth(), getAllPrograms);
router.get('/my-active', auth(), getMyActivePrograms);
router.post('/:programId/activate', auth(), validateRequest(activateProgramValidation), activateProgramForMe);
router.get('/:programId/progress', auth(), validateRequest(getProgramProgressValidation), getMyProgramProgress);
router.post(
  '/:programId/weeks/:programWeekId/exercises/:exerciseId/done',
  auth(),
  validateRequest(setExerciseDoneValidation),
  setExerciseDoneForMe
);


router.get('/by-id/:id', getProgramById);
router.put('/update/:id', auth(), fileUploader.upload.single('coverImage'), validateRequest(updateProgramValidation), updateProgram);
router.post('/:id/upload-cover', auth(), fileUploader.upload.single('coverImage'), uploadCoverImage);
router.delete('/delete/:id', auth(), validateRequest(deleteProgramValidation), deleteProgram);

export const programRoutes = router;
