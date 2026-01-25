import { Response } from "express";

type TokenInfo = {
    accessToken: string;
    refreshToken: string;
};

export const setAuthCookie = (res: Response, tokenInfo: TokenInfo) => {

    // Access Token (short-lived)
    res.cookie("accessToken", tokenInfo.accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60
    });

    // Refresh Token (long-lived)
    res.cookie("refreshToken", tokenInfo.refreshToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 90
    });
};




