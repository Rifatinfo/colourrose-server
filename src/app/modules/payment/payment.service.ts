import { StatusCodes } from "http-status-codes";
import AppError from "../../middlewares/AppError";
import prisma from "../../../shared/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";


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
                orderStatus: OrderStatus.PENDING
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
                orderStatus: OrderStatus.PENDING,
            },
        });
    });

    return { success: true, message: "Payment cancelled" };
};

const initPayment = async (orderId: string) => {
    //============= 1 Find the order ==================//
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payment: true, user: true },
    });

    if (!order) {
        throw new AppError(404, "Order not found");
    }

    const payment = order.payment;

    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found for this order");
    }
    //=============== 3 Prepare SSLCommerz payload ==================//
    const sslPayload: ISSLCommerz = {
        name: order.name,
        email: (order.user as any)?.email || "",      
        phone: order.phone,
        address: order.address,
        totalAmount: Number(payment.amount),
        transactionId: payment.transactionId,
    };
    console.log(sslPayload);

    //================ 4 Call SSLCommerz API ==================//
    const sslPayment = await SSLService.sslPaymentInit(sslPayload);

    //================ 5 Return payment URL ==================//
    return {
        paymentUrl: sslPayment.GatewayPageURL,
    };
};

export const PaymentService = {
    successPayment,
    failPayment,
    cancelPayment,
    initPayment
};