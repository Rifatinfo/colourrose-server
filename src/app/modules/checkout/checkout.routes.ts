import { Router } from "express";
import { CheckoutController } from "./checkout.controller";

const router = Router();

router.post("/", CheckoutController.checkoutController);

export const CheckoutRoutes = router;