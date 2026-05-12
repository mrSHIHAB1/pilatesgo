import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { programService } from './program.service';
import { fileUploader } from '../../helpers/fileUploader';
import httpStatus from 'http-status-codes';

// Create a new program
export const createProgram = catchAsync(async (req: Request, res: Response) => {
    // Get user from auth middleware
    const user = req.user as { userId: string } | undefined;
    
   

    const userId = user?.userId;
  

  let coverImageUrl = req.body.coverImage;

  // Handle file upload if present
  if (req.file) {
    const uploadedFile = await fileUploader.uploadToCloudinary(req.file);
    if (uploadedFile) {
      coverImageUrl = uploadedFile.secure_url;
    }
  }

  // Parse workoutIds from form-data (handle single string or array)
  let workoutIds: string[] | undefined = undefined;
  if (req.body.workoutIds) {
    workoutIds = Array.isArray(req.body.workoutIds)
      ? req.body.workoutIds
      : [req.body.workoutIds];
  }

  // Parse durationWeeks (handle both duration and durationWeeks field names)
  const durationWeeks = req.body.durationWeeks || req.body.duration;
console.log(req.body, "from create program controller");
const payload = JSON.parse(req.body.data);


  const result = await programService.createProgram(payload);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Program created successfully',
    data: result,
  });
});

// Get all programs
export const getAllPrograms = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const search = req.query.search as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const creatorId = req.query.creatorId as string | undefined;

  const result = await programService.getAllPrograms(
    page,
    limit,
    search,
    categoryId,
    difficulty,
    creatorId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Programs fetched successfully',
    data: result,
  });
});

// Get a specific program by ID
export const getProgramById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await programService.getProgramById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Program fetched successfully',
    data: result,
  });
});

// Update a program
export const updateProgram = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  // Get user from auth middleware
  const user = req.user as { userId: string } | undefined;
  
  if (!user || !user.userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized: User not authenticated',
      data: null,
    });
  }

  // Validate difficulty if provided
  if (req.body.difficulty && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(req.body.difficulty)) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED',
      data: null,
    });
  }

  let coverImageUrl = req.body.coverImage;

  // Handle file upload if present
  if (req.file) {
    const uploadedFile = await fileUploader.uploadToCloudinary(req.file);
    if (uploadedFile) {
      coverImageUrl = uploadedFile.secure_url;
    }
  }

  // Parse workoutIds from form-data (handle single string or array)
  let workoutIds: string[] | undefined = undefined;
  if (req.body.workoutIds) {
    workoutIds = Array.isArray(req.body.workoutIds)
      ? req.body.workoutIds
      : [req.body.workoutIds];
  }

  // Parse durationWeeks (handle both duration and durationWeeks field names)
  const durationWeeks = req.body.durationWeeks || req.body.duration;

  const updateData = {
    id,
    title: req.body.title,
    difficulty: req.body.difficulty,
    description: req.body.description,
    thumbnail: req.body.thumbnail,
    categoryId: req.body.categoryId,
    durationWeeks: durationWeeks ? parseInt(durationWeeks) : undefined,
    coverImage: coverImageUrl,
    workoutIds,
  };

  const result = await programService.updateProgram(id, updateData);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Program updated successfully',
    data: result,
  });
});

// Upload cover image for a program
export const uploadCoverImage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  // Get user from auth middleware
  const user = req.user as { userId: string } | undefined;
  
  if (!user || !user.userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized: User not authenticated',
      data: null,
    });
  }

  if (!req.file) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'No file uploaded',
      data: null,
    });
  }

  const uploadedFile = await fileUploader.uploadToCloudinary(req.file);
  
  if (!uploadedFile) {
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      message: 'Failed to upload image to Cloudinary',
      data: null,
    });
  }

  const result = await programService.updateProgram(id, {
    id,
    coverImage: uploadedFile.secure_url,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cover image uploaded successfully',
    data: result,
  });
});

// Delete a program
export const deleteProgram = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await programService.deleteProgram(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Program deleted successfully',
    data: result,
  });
});
