import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catchAsync";
import sendResponse from "../../middlewares/sendResponse";
import { AuthService } from "./auth.service";
import { User, UserRole } from "@prisma/client";
import AppError from "../../middlewares/AppError";
import { StatusCodes } from "http-status-codes";
import { createUserTokens } from "../../../utiles/createUserTokens";
import { setAuthCookie } from "../../../utiles/setAuthCookie";
import config from "../../../config";

const login = catchAsync(async (req: Request, res: Response ) => {
    const result = await AuthService.login(req.body);
    const { accessToken, refreshToken, needPasswordChange } = result;

    res.cookie("accessToken", accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60
    })
    res.cookie("refreshToken", refreshToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 90
    })

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "User logged in successfully!",
        data: {
            needPasswordChange,
            // accessToken,   // just for checking in frontend, remove later
            // refreshToken   // just for checking in frontend, remove later
        }
    })
})

const googleCallbackController = catchAsync(async (req: Request, res: Response) => {
  // 1. Get the user attached by Passport
  const user = req.user ;
  console.log(user);
  
  
  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Authentication failed");
  }

  // 2. Generate your JWTs
  const tokenInfo = createUserTokens(user);
  
  // 3. Set the cookie
  setAuthCookie(res, tokenInfo);

  // 4. Handle Redirect State
  let redirectUrl = (req.query.state as string) || "/";
  console.log(redirectUrl);
  
  if (redirectUrl.startsWith("/")) {
    redirectUrl = redirectUrl.slice(1);
  }
  console.log("OAuth state:", req.query.state);
  res.redirect(`${config.FRONTEND_URL}/${redirectUrl}?loggedIn=true`);
});


export const AuthController = {
    login,
    googleCallbackController
};

