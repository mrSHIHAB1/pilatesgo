import { Router } from 'express';
import {
  uploadVideo,
  createVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
} from './video.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  uploadVideoValidation,
  createVideoValidation,
  getVideoValidation,
  getVideosValidation,
  updateVideoValidation,
  deleteVideoValidation,
} from './video.validation';
import { fileUploader } from '../../helpers/fileUploader';
import auth from '../../middlewares/auth';

const router = Router();

// POST /videos/upload - Upload video file to Cloudinary
router.post(
  '/upload',
  fileUploader.upload.single('video'),
  validateRequest(uploadVideoValidation),
  uploadVideo
);

// POST /videos - Create a new video (manual URL)
router.post('/create', validateRequest(createVideoValidation), createVideo);

// GET /videos - Get all videos with pagination and filters
router.get('/all',auth(), getAllVideos);

// GET /videos/:id - Get a specific video by ID
router.get('/by-id/:id', auth(), getVideoById);

// PUT /videos/:id - Update a video
router.put('/update/:id', validateRequest(updateVideoValidation), updateVideo);

// DELETE /videos/:id - Delete a video
router.delete('/delete/:id', validateRequest(deleteVideoValidation), deleteVideo);

export const videoRoutes = router;
