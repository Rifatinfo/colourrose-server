
import { Router } from "express";
import {  OrderController } from "./order.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.post("/", auth(UserRole.CUSTOMER) , OrderController.createOrderController);

export const OrderRoutes = router;