import * as Prisma from "../../../prisma/generated/prisma/internal/prismaNamespace";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";

// Sanitize error to prevent exposing sensitive information in production
const sanitizeError = (error: any) => {
    // Don't expose Prisma errors in production
    if (process.env.NODE_ENV === "production" && error.code?.startsWith("P")) {
        return {
            message: "Database operation failed",
            errorDetails: null,
        };
    }
    return error;
};

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    console.log({ err });

    let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
    let success = false;
    let message = err.message || "Something went wrong!";
    let error = err;

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    if (err?.name === 'ZodError') {
        statusCode = httpStatus.BAD_REQUEST;
        message = err.message;
        error = err;
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        message = 'Validation Error';
        error = err.message
    }
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            message = "Duplicate Key error";
            error = err.meta;
        }
    }

    // Sanitize error before sending response
    const sanitizedError = sanitizeError(error);

    res.status(statusCode).json({
        success,
        message,
        error: sanitizedError
    })
};

export default globalErrorHandler;