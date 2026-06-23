import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { programService } from './program.service';
import { fileUploader } from '../../helpers/fileUploader';

// ─── PROGRAM CONTROLLERS ──────────────────────────────────────────────────────

// Create a new program
export const createProgram = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as { userId: string } | undefined;
  const userId = user?.userId;

  let coverImageUrl = req.body.coverImage;

  if (req.file) {
    const uploadedFile = await fileUploader.uploadToCloudinary(req.file);
    if (uploadedFile) {
      coverImageUrl = uploadedFile.secure_url;
    }
  }

  const rawPayload = req.body?.data ? JSON.parse(req.body.data) : req.body;
  const payload = {
    ...rawPayload,
    creatorId: rawPayload?.creatorId ?? userId,
    coverImage: coverImageUrl,
    durationWeeks: rawPayload?.durationWeeks ?? rawPayload?.duration,
  };

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
  const user = req.user as { userId: string } | undefined;

  if (!user || !user.userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized: User not authenticated',
      data: null,
    });
  }

  if (req.body.difficulty && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(req.body.difficulty)) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED',
      data: null,
    });
  }

  let coverImageUrl = req.body.coverImage;

  if (req.file) {
    const uploadedFile = await fileUploader.uploadToCloudinary(req.file);
    if (uploadedFile) {
      coverImageUrl = uploadedFile.secure_url;
    }
  }

  const rawPayload = req.body?.data ? JSON.parse(req.body.data) : req.body;
  const durationWeeks = rawPayload?.durationWeeks ?? rawPayload?.duration;

  const updateData = {
    ...rawPayload,
    id,
    durationWeeks: durationWeeks ? parseInt(durationWeeks) : undefined,
    coverImage: coverImageUrl,
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

// ─── PROGRESS CONTROLLERS ─────────────────────────────────────────────────────

export const activateProgramForMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;
  const { programId } = req.params as { programId: string };

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const result = await programService.activateProgram(userId, programId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Program activated successfully',
    data: result,
  });
});

export const getMyActivePrograms = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const result = await programService.getMyActivePrograms(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Active programs fetched successfully',
    data: result,
  });
});

export const setExerciseDoneForMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;
  const { programId, programWeekId, programDayId } = req.params as {
    programId: string;
    programWeekId: string;
    programDayId: string;
  };

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const { exerciseId, done = true } = (req.body || {}) as { exerciseId: string; done?: boolean };

  const result = await programService.setExerciseDone({
    userId,
    programId,
    programWeekId,
    programDayId,
    exerciseId,
    done,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: done ? 'Item marked as done' : 'Item marked as not done',
    data: result,
  });
});

export const getMyProgramSnapshot = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;
  const { programId } = req.params as { programId: string };

  if (!userId) return sendResponse(res, { statusCode: 401, success: false, message: 'Unauthorized', data: null });

  const result = await programService.getProgramSnapshot(userId, programId);

  sendResponse(res, { statusCode: 200, success: true, message: 'Program snapshot fetched', data: result });
});

export const setSnapshotItemDoneForMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;
  const { programId, snapshotWeekId, snapshotDayId, snapshotItemId } = req.params as {
    programId: string;
    snapshotWeekId: string;
    snapshotDayId: string;
    snapshotItemId: string;
  };

  if (!userId) return sendResponse(res, { statusCode: 401, success: false, message: 'Unauthorized', data: null });

  const { done = true } = (req.body || {}) as { done?: boolean };

  const result = await programService.setSnapshotItemDone({
    userId,
    programId,
    snapshotWeekId,
    snapshotDayId,
    snapshotItemId,
    done,
  });

  sendResponse(res, { statusCode: 200, success: true, message: done ? 'Item marked done' : 'Item marked not done', data: result });
});

export const getMyProgramProgress = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;
  const { programId } = req.params as { programId: string };

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const result = await programService.getProgramProgress(userId, programId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Program progress fetched successfully',
    data: result,
  });
});

// ─── REVIEW CONTROLLERS ───────────────────────────────────────────────────────

export const createOrUpdateReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as { userId: string }).userId;
  const { programId } = req.params as { programId: string };

  const rawBody = req.body?.data ? JSON.parse(req.body.data) : req.body;
  const rating = parseInt(rawBody.rating as string, 10);
  const comment = rawBody.comment as string | undefined;

  const photoFiles = req.files as Express.Multer.File[] | undefined;

  const result = await programService.createOrUpdateReview(
    userId,
    programId,
    { rating, comment },
    photoFiles
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review submitted successfully',
    data: result,
  });
});

export const getReviewsForProgram = catchAsync(async (req: Request, res: Response) => {
  const { programId } = req.params as { programId: string };
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  const result = await programService.getReviewsForProgram(programId, page, limit);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reviews fetched successfully',
    data: result,
  });
});

export const deleteMyReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as { userId: string }).userId;
  const { programId } = req.params as { programId: string };

  await programService.deleteMyReview(userId, programId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review deleted successfully',
    data: null,
  });
});

export const getMyReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as { userId: string }).userId;
  const { programId } = req.params as { programId: string };

  const result = await programService.getMyReview(userId, programId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result ? 'Your review fetched successfully' : 'You have not reviewed this program yet',
    data: result,
  });
});

export const getMyTodaysChallenges = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const result = await programService.getMyTodaysChallenges(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Today's challenges fetched successfully",
    data: result,
  });
});

export const getMyUpcomingChallenges = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const result = await programService.getMyUpcomingChallenges(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Upcoming challenges fetched successfully',
    data: result,
  });
});
