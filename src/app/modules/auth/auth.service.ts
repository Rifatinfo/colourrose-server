import { UserStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../middlewares/AppError";
import { StatusCodes } from "http-status-codes";
import { jwtHelper } from "../../../utiles/jwtHelper";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";

const login = async (payload: { email: string, password: string }) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE
        }
    })

    if (!user.password) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Password is not set!")
    }

    const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
    if (!isCorrectPassword) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Password is incorrect!")
    }

    const accessToken = jwtHelper.generateToken(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        config.JWT_SECRET as Secret,
        config.ACCESS_TOKEN_EXPIRY as string
    );

    const refreshToken = jwtHelper.generateToken(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        config.REFRESH_TOKEN_SECRET as Secret,
        config.REFRESH_TOKEN_EXPIRY as string
    );


    return {
        accessToken,
        refreshToken,
        needPasswordChange: user.needPasswordChange
    }
}

const refreshToken = async (token: string) => {
    let decodedData;
    try {
        decodedData = jwtHelper.verifyToken(token, config.REFRESH_TOKEN_SECRET as Secret);
    }
    catch (err) {
        throw new Error("You are not authorized!")
    }

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            status: UserStatus.ACTIVE
        }
    });

    const accessToken = jwtHelper.generateToken({
        email: userData.email,
        role: userData.role
    },
        config.JWT_SECRET as Secret,
        config.ACCESS_TOKEN_EXPIRY as string
    );

    return {
        accessToken,
        needPasswordChange: userData.needPasswordChange
    };

};


export const AuthService = {
    login,
    refreshToken
};

