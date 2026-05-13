import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { programProgressService } from './program.progress.service';

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

  const result = await programProgressService.activateProgram(userId, programId);

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

  const result = await programProgressService.getMyActivePrograms(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Active programs fetched successfully',
    data: result,
  });
});

export const setExerciseDoneForMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;
  const { programId, programWeekId, exerciseId } = req.params as {
    programId: string;
    programWeekId: string;
    exerciseId: string;
  };

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const done = (req.body as { done?: boolean } | undefined)?.done ?? true;

  const result = await programProgressService.setExerciseDone({
    userId,
    programId,
    programWeekId,
    exerciseId,
    done,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: done ? 'Exercise marked as done' : 'Exercise marked as not done',
    data: result,
  });
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

  const result = await programProgressService.getProgramProgress(userId, programId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Program progress fetched successfully',
    data: result,
  });
});
