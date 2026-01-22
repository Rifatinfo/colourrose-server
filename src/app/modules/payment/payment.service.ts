import { StatusCodes } from "http-status-codes";
import AppError from "../../middlewares/AppError";
import prisma from "../../../shared/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";

const successPayment = async (query: Record<string, string>) => {
    const { transactionId } = query;
    if (!transactionId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction ID is required");
    }

    //================ FIND PAYMENT ================//
    const payment = await prisma.payment.findUnique({
        where: { transactionId }
    });

    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    //================ ALREADY PAID ================//
    if (payment.paymentStatus === PaymentStatus.PAID) {
        return {
            success: true,
            message: "Payment already processed"
        };
    }

    //================ TRANSACTION PROCESSING ================//
    await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
            where: {
                id: payment.id
            },
            data: {
                paymentStatus: PaymentStatus.PAID,
                paidAt: new Date()
            }
        });

        //================ Update order status ===============//
        await tx.order.update({
            where: { id: payment.orderId },
            data: {
                paymentStatus: PaymentStatus.PAID,
                orderStatus: OrderStatus.CONFIRMED
            }
        })
    });

    return {
        success: true,
        message: "Payment processed successfully"
    };
}


/**===============================================
 *=============== FAIL PAYMENT =================
 =================================================*/
const failPayment = async (query: Record<string, string>) => {
    const { transactionId } = query;

    if (!transactionId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction ID missing");
    }

    const payment = await prisma.payment.findUnique({
        where: { transactionId },
    });

    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    //================ Prevent double update ================//
    if (payment.paymentStatus === PaymentStatus.PAID) {
        return { success: false, message: "Payment already completed" };
    }

    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                paymentStatus: PaymentStatus.FAILED,
                failedAt: new Date(),
            },
        });

        await tx.order.update({
            where: { id: payment.orderId },
            data: {
                paymentStatus: PaymentStatus.FAILED,
                orderStatus: OrderStatus.FAILED
            },
        });
    });

    return { success: true, message: "Payment failed" };
};


/**===============================================
 *=============== CANCEL PAYMENT =================
 =================================================*/
const cancelPayment = async (query: Record<string, string>) => {
    const { transactionId } = query;

    if (!transactionId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction ID missing");
    }

    const payment = await prisma.payment.findUnique({
        where: { transactionId },
    });

    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    // Prevent double update
    if (payment.paymentStatus === PaymentStatus.PAID) {
        return { success: false, message: "Payment already completed" };
    }

    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                paymentStatus: PaymentStatus.CANCELED,
                cancelledAt: new Date(),
            },
        });

        await tx.order.update({
            where: { id: payment.orderId },
            data: {
                paymentStatus: PaymentStatus.CANCELED,
                orderStatus: OrderStatus.CANCELED,
            },
        });
    });

    return { success: true, message: "Payment cancelled" };
};
export const PaymentService = {
    successPayment,
    failPayment,
    cancelPayment
};