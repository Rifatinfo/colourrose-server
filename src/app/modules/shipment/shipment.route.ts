import { UserRole } from "@prisma/client";
import { Router } from "express";
import { ShipmentController } from "./shipment.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/:orderId", auth(UserRole.SHOP_MANAGER, UserRole.ADMIN), ShipmentController.addShipmentTrackingController);

export const OrderShipment = router;
