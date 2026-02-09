
import { Router } from "express";
import {  OrderController } from "./order.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.post("/", auth(UserRole.CUSTOMER) , OrderController.createOrderController);
router.get("/", auth(UserRole.SHOP_MANAGER, UserRole.ADMIN), OrderController.getAllOrdersController);
router.get("/my-orders", auth(UserRole.CUSTOMER), OrderController.getMyOrdersController);
router.patch("/:orderId/status", auth(UserRole.SHOP_MANAGER),OrderController.updateOrderStatusController);
router.get("/:orderId/tracking", auth(UserRole.CUSTOMER), OrderController.getOrderTrackingController);
router.get("/:orderId", auth(UserRole.CUSTOMER, UserRole.ADMIN), OrderController.getSingleOrderController);


export const OrderRoutes = router;


