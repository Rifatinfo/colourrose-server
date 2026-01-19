import { Request } from "express";
import AppError from "../../middlewares/AppError";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../shared/prisma";
import { CheckoutBody } from "./checkout.interface";

const createCheckout = async (
    req: Request & { user?: { id: string } }
) => {
    const userId = req.user!.id;
    const { deliveryInfo, cartItems, paymentMethod } = req.body as CheckoutBody;

    if (!deliveryInfo || !cartItems.length || !paymentMethod) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid checkout data");
    }

    const order = await prisma.$transaction(async (tx) => {
        let subtotal = 0;

        const orderItemsData = await Promise.all(
            cartItems.map(async (item) => {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product)
                    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");

                if (product.stockQuantity < item.quantity)
                    throw new AppError(
                        StatusCodes.BAD_REQUEST,
                        `Insufficient stock for: ${product.name}`
                    );

                const price = product.salePrice ?? product.regularPrice;
                subtotal += price * item.quantity;

                return {
                    productId: product.id,
                    productName: product.name,
                    price,
                    quantity: item.quantity,
                    total: price * item.quantity,
                };
            })
        );

        const order = await tx.order.create({
            data: {
                userId,
                ...deliveryInfo,
                subtotal,
                totalAmount: subtotal,
                orderStatus: "PENDING",
                paymentStatus: "UNPAID",
                paymentMethod,
                items: { create: orderItemsData },
            },
        });

        for (const item of cartItems) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { decrement: item.quantity } },
            });
        }

        return order;
    });

    return order;
};
export const CheckoutService = {
    createCheckout,
}