import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { videoService } from './video.service';

// Upload video file to Cloudinary
export const uploadVideo = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'No video file provided',
      data: null,
    });
  }

  const result = await videoService.uploadVideo(req.file, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Video uploaded and saved successfully',
    data: result,
  });
});

// Create a new video
export const createVideo = catchAsync(async (req: Request, res: Response) => {
  const result = await videoService.createVideo(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Video created successfully',
    data: result,
  });
});

// Get all videos
export const getAllVideos = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const difficulty = req.query.difficulty as string | undefined;
  const visibility = req.query.visibility as string | undefined;

  const result = await videoService.getAllVideos(page, limit, {
    difficulty,
    visibility,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Videos fetched successfully',
    data: result,
  });
});

// Get a specific video by ID
export const getVideoById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await videoService.getVideoById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video fetched successfully',
    data: result,
  });
});

// Update a video
export const updateVideo = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await videoService.updateVideo(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video updated successfully',
    data: result,
  });
});

// Delete a video
export const deleteVideo = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await videoService.deleteVideo(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video deleted successfully',
    data: null,
  });
});
