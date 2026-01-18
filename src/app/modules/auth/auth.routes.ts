import express, { NextFunction, Request, Response } from "express"; 
import { AuthController } from "./auth.controller";
import passport from "passport";
import config from "../../../config";
const router = express.Router();

router.post("/login", AuthController.login);
//======================= The trigger route =======================//
router.get(
  "/google",
  (req, res, next) => {

    // Capture the target frontend page if passed as a query param
    const state = req.query.redirect as string || "/checkout"; 
    passport.authenticate("google", {
      scope: ["profile", "email"], //========== Explicitly define scopes here ==========//
      state: state,                //========== Pass state to maintain redirect URL ==========//
      session: false,
    })(req, res, next);
  }
);

//======================= The callback route =======================//
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${config.FRONTEND_URL}/?error=auth_failed`,
    session: false,
  }),
  AuthController.googleCallbackController
);


export const AuthRoutes = router;