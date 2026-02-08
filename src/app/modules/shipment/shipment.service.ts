import { OrderStatus, ShipmentStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import AppError from "../../middlewares/AppError";
import { StatusCodes } from "http-status-codes";

const addShipmentTrackingService = async (
    orderId: string,
    status: ShipmentStatus,
    reason?: string,
    location?: string
) => {
    return prisma.$transaction(async (tx) => {

        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!order) {
            throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
        }
        //  Add shipment tracking (always)
        const tracking = await tx.shipmentTracking.create({
            data: {
                orderId,
                status,
                message: reason,
                location,
            },
        });

        //  CANCEL LOGIC (CENTRALIZED HERE)
        if (status === ShipmentStatus.CANCELED) {



            //  Restore stock

            for (const item of order.items) {

                //================  1. Restore PRODUCT stock ================//
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: { increment: item.quantity },
                    },
                });

                //================  2. Restore VARIANT stock ================//
                if (item.variantId) {
                    await tx.variant.update({
                        where: { id: item.variantId },
                        data: {
                            quantity: { increment: item.quantity },
                        },
                    });
                }
            }
            //  Update order status
            await tx.order.update({
                where: { id: orderId },
                data: { orderStatus: OrderStatus.CANCELED },
            });

            return tracking;
        }

        //  AUTO ORDER STATUS SYNC
        if (status === ShipmentStatus.PACKAGE_SHIPPED) {
            await tx.order.update({
                where: { id: orderId },
                data: { orderStatus: OrderStatus.SHIPPED },
            });
        }

        if (status === ShipmentStatus.DELIVERED) {
            await tx.order.update({
                where: { id: orderId },
                data: { orderStatus: OrderStatus.DELIVERED },
            });
        }

        return tracking;
    });
};


export const ShipmentService = {
    addShipmentTrackingService,
}