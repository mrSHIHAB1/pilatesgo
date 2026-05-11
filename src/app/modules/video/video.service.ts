import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';
import { fileUploader } from '../../helpers/fileUploader';
import { ICreateVideoRequest, IUpdateVideoRequest, IVideoResponse, IVideoListResponse } from './video.interface';

// Upload video file to Cloudinary and create video record
const uploadVideo = async (file: Express.Multer.File,payload: Omit<ICreateVideoRequest, 'url'>): Promise<IVideoResponse> => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Video file is required');
  }

  // Upload video to Cloudinary
  const uploadResult = await fileUploader.uploadToCloudinary(file);

  if (!uploadResult || !uploadResult.secure_url) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload video to Cloudinary');
  }

  // Get video duration from Cloudinary response
  const duration = uploadResult.duration ? Math.round(uploadResult.duration) : undefined;
  
  // Create video record in database with Cloudinary URL
  const video = await prisma.video.create({
    data: {
      title: payload.title,
      url: uploadResult.secure_url,
      difficulty: payload.difficulty,
      visibility: payload.visibility,
      duration: duration || payload.duration,
      categoriesId: payload.categoriesId,
    },
  });

  return video;
};

// Create a new video (for manual URL input)
const createVideo = async (payload: ICreateVideoRequest): Promise<IVideoResponse> => {
  const video = await prisma.video.create({
    data: {
      title: payload.title,
      url: payload.url,
      difficulty: payload.difficulty,
      visibility: payload.visibility,
      duration: payload.duration,
      categoriesId: payload.categoriesId,
    },
  });

  return video;
};

// Get all videos with pagination and filters
const getAllVideos = async (
  page: number = 1,
  limit: number = 10,
  filters?: { difficulty?: string; visibility?: string }
): Promise<IVideoListResponse> => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters?.difficulty) where.difficulty = filters.difficulty;
  if (filters?.visibility) where.visibility = filters.visibility;

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.video.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: videos,
    total,
    page,
    limit,
    totalPages,
  };
};

// Get a specific video by ID
const getVideoById = async (id: string): Promise<IVideoResponse> => {
  const video = await prisma.video.findUnique({
    where: { id },
  });

  if (!video) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
  }

  return video;
};

// Update a video
const updateVideo = async (id: string, payload: Partial<ICreateVideoRequest>): Promise<IVideoResponse> => {
  // Check if video exists
  const existingVideo = await prisma.video.findUnique({
    where: { id },
  });

  if (!existingVideo) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
  }

  const updatedVideo = await prisma.video.update({
    where: { id },
    data: {
      ...(payload.title && { title: payload.title }),
      ...(payload.url && { url: payload.url }),
      ...(payload.difficulty && { difficulty: payload.difficulty }),
      ...(payload.visibility && { visibility: payload.visibility }),
      ...(payload.duration !== undefined && { duration: payload.duration }),
      ...(payload.categoriesId && { categoriesId: payload.categoriesId }),
    },
  });

  return updatedVideo;
};

// Delete a video
const deleteVideo = async (id: string): Promise<void> => {
  const video = await prisma.video.findUnique({
    where: { id },
  });

  if (!video) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
  }

  await prisma.video.delete({
    where: { id },
  });
};

export const videoService = {
  uploadVideo,
  createVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
};
