import { Router } from 'express';
import {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  uploadCoverImage,
  deleteProgram,
  activateProgramForMe,
  getMyActivePrograms,
  getMyProgramProgress,
  setExerciseDoneForMe,
  createOrUpdateReview,
  getReviewsForProgram,
  deleteMyReview,
  getMyReview,
} from './program.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createProgramValidation,
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

// ── Review Routes ────────────────────────────────────────────────────────────
// POST   /programs/:programId/reviews         – create or update review (multipart, up to 5 photos)
// GET    /programs/:programId/reviews         – list reviews + avg rating
// GET    /programs/:programId/reviews/my      – get my review for this program
// DELETE /programs/:programId/reviews/my      – delete my review
router.post(
  '/:programId/reviews',
  auth(),
  fileUploader.upload.array('photos', 5),
  createOrUpdateReview
);
router.get('/:programId/reviews', getReviewsForProgram);
router.get('/:programId/reviews/my', auth(), getMyReview);
router.delete('/:programId/reviews/my', auth(), deleteMyReview);

export const programRoutes = router;
