import { StatusCodes } from "http-status-codes";
import AppError from "../../middlewares/AppError";
import { DELIVERY_CHARGE } from "../../../config/delivery.config";
import { CreateOrderDTO } from "./order.interface";
import prisma from "../../../shared/prisma";
import { Decimal } from "@prisma/client/runtime/client";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { SSLService } from "../sslCommerz/sslCommerz.service";

const getTransactionId = () => {
    return 'TXN_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

export const createOrderService = async (
    userId: string,
    userEmail: string,
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

    const result = await prisma.$transaction(async (tx) => {
        let subtotal = 0;

        // ================== Prepare order items ================== //
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

        // ================== Create Order ================== //
        const order = await tx.order.create({
            data: {
                userId,
                name: deliveryInfo.name,
                phone: deliveryInfo.phone,
                state: deliveryInfo.state,
                address: deliveryInfo.address,

                subtotal,
                totalAmount,
                paymentMethod: payload.paymentMethod === "ONLINE" ? PaymentMethod.ONLINE : PaymentMethod.COD,
                orderStatus: "PENDING",
                paymentStatus: "UNPAID",

                items: { create: orderItems },
            },
            include: { items: true },
        });

        // ================== Reduce Variant Stock ================== //
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

        // ================== Optional: reduce main product stock ================== // 
        for (const item of cartItems) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: { decrement: item.quantity },
                },
            });
        }


        // ========== CREATE PAYMENT (ONLY ONLINE) ==========
        let payment = null;
        if (paymentMethod === "ONLINE") {
            payment = await tx.payment.create({
                data: {
                    orderId: order.id,
                    transactionId: getTransactionId(), // you generate unique transaction id
                    paymentStatus: PaymentStatus.UNPAID,
                    amount: new Decimal(totalAmount),
                    currency: "BDT",
                    paymentMethod: "SSLCommerz",
                },
            });
        }

        return { ...order, deliveryType, deliveryCharge, payment };
    });

    // ================== OUTSIDE DB TRANSACTION ==================
    // IMPORTANT: External API call must be outside prisma.$transaction
    if (paymentMethod === "ONLINE" && result.payment) {
        const sslPayload = {
            transactionId: result.payment.transactionId,
            totalAmount: Number(result.payment.amount),
            name: result.name,
            email: userEmail,
            phone: result.phone,
            address: result.address,
        };

        const sslResponse = await SSLService.sslPaymentInit(sslPayload);

        return {
            order: result,
            paymentUrl: sslResponse.GatewayPageURL,
        };
    }

    // ========== COD ==========
    return {
        order: result,
        deliveryCharge: result.deliveryCharge,
    };
};

export const OrderService = {
    createOrderService
}