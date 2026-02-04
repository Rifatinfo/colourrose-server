import { NextFunction, Request, Response } from "express"
import AppError from "./AppError";
import { StatusCodes } from "http-status-codes";
import { jwtHelper } from "../../utiles/jwtHelper";
import config from "../../config";
import { Secret } from "jsonwebtoken";

const auth = (...roles: string[]) => {
    return async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
        try {
            // const token = req.headers.authorization || req.cookies.accessToken;
            const authHeader = req.headers.authorization;

            const token =
                authHeader?.startsWith("Bearer ")
                    ? authHeader.split(" ")[1] // 🔥 extract token
                    : req.cookies.accessToken;
            console.log({ token }, "form auth guard");

            if (!token) {
                throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized to access this resource, No Token Found");
            }

            const verifiedUser = jwtHelper.verifyToken(token, config.JWT_SECRET as Secret);

            req.user = {
                id: verifiedUser.id,
                role: verifiedUser.role,
                email: verifiedUser.email ?? null,
            };
            console.log("Token:", token);
            console.log("Decoded:", verifiedUser);
            console.log("Required Roles:", roles);

            if (roles.length && !roles.includes(verifiedUser.role)) {
                throw new AppError(StatusCodes.FORBIDDEN, "You are not allowed to access this resource");
            }

            next();

        } catch (error) {
            next(error);
        }
    }
}

export default auth;