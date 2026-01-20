import { StatusCodes } from "http-status-codes";
import AppError from "../../middlewares/AppError";
import { DELIVERY_CHARGE } from "../../../config/delivery.config";
import { CreateOrderDTO } from "./order.interface";
import prisma from "../../../shared/prisma";


export const createOrderService = async (
    userId: string,
    payload: CreateOrderDTO
) => {
    const { deliveryInfo, cartItems, paymentMethod, deliveryType } = payload;

    if (!cartItems || cartItems.length === 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Cart is empty");
    }

    const deliveryCharge = DELIVERY_CHARGE[deliveryType];
    if (deliveryCharge === undefined) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid delivery option");
    }

    return await prisma.$transaction(async (tx) => {
        let subtotal = 0;

        // ================== Prepare order items ==================
        const orderItems = await Promise.all(
            cartItems.map(async (item) => {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) throw new AppError(StatusCodes.NOT_FOUND, "Product not found");

                // Find the variant
                const variant = await tx.variant.findFirst({
                    where: {
                        productId: item.productId,
                        color: item.color,
                        size: item.size,
                    },
                });

                if (!variant) throw new AppError(StatusCodes.NOT_FOUND, "Variant not found");
                if (variant.quantity < item.quantity) {
                    throw new AppError(
                        StatusCodes.BAD_REQUEST,
                        `Insufficient stock for ${product.name} ${item.color} ${item.size}`
                    );
                }

                const price = product.salePrice ?? product.regularPrice;
                const total = price * item.quantity;
                subtotal += total;

                return {
                    productId: product.id,
                    productName: product.name,
                    price,
                    quantity: item.quantity,
                    total,
                    color: item.color,
                    size: item.size,
                };
            })
        );

        const totalAmount = subtotal + deliveryCharge;

        // ================== Create Order ==================
        const order = await tx.order.create({
            data: {
                userId,
                name: deliveryInfo.name,
                phone: deliveryInfo.phone,
                state: deliveryInfo.state,
                address: deliveryInfo.address,

                subtotal,
                totalAmount,
                paymentMethod: paymentMethod as any,
                orderStatus: "PENDING",
                paymentStatus: "UNPAID",

                items: { create: orderItems },
            },
            include: { items: true },
        });

        // ================== Reduce Variant Stock ==================
        for (const item of cartItems) {
            await tx.variant.updateMany({
                where: {
                    productId: item.productId,
                    color: item.color,
                    size: item.size,
                },
                data: {
                    quantity: { decrement: item.quantity },
                },
            });
        }

        // ================== Optional: reduce main product stock ==================
        for (const item of cartItems) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: { decrement: item.quantity },
                },
            });
        }

        return { ...order, deliveryType, deliveryCharge };
    });
};

export const OrderService = {
    createOrderService
}