import ApiError from "../app/errors/ApiError";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { generateToken, verifyToken } from "./jwt";
import { envVars } from "../app/config/env";
import prisma from "../app/shared/prisma";
import { IUserResponse } from "../app/modules/user/user.interface";

export const createUserTokens=(user:Partial<IUserResponse>)=>{

    const jwtPayload={
        userId:user.id,
        email:user.email,
    }

    const accessToken=generateToken(jwtPayload,envVars.JWT_ACCESS_SECRET!,envVars.JWT_ACCESS_EXPIRES!);
     const refreshToken=generateToken(jwtPayload,envVars.JWT_REFRESH_SECRET!,envVars.JWT_REFRESH_EXPIRES!);
     
     return {
        accessToken,
        refreshToken
     }

}

export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {

    const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET!) as JwtPayload


    const isUserExist = await prisma.user.findUnique({ where: { email: verifiedRefreshToken.email } })

    if (!isUserExist) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User does not exist")
    }
   
    if (isUserExist.isDeleted) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User is deleted")
    }

    const jwtPayload = {
        userId: isUserExist.id,
        email: isUserExist.email,
    }
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET!, envVars.JWT_ACCESS_EXPIRES!)

    return accessToken
}