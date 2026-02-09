import { StatusCodes } from "http-status-codes";
import AppError from "../../middlewares/AppError";
import { DELIVERY_CHARGE } from "../../../config/delivery.config";
import { CreateOrderDTO } from "./order.interface";
import prisma from "../../../shared/prisma";
import { Decimal } from "@prisma/client/runtime/client";
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { generateInvoice } from "../../../utiles/invoice";
import { sendEmail } from "../../../utiles/sendEmail";
import { parseDeliveryType } from "../../../utiles/parseDeliveryType";
import { paginationHelper } from "../../../utiles/paginationHelper";
import { orderSearchableFields } from "./order.constant";
import ApiError from "../../errors/ApiError";

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
                    variantId: variant.id,
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
                deliveryCharge,
                deliveryType: parseDeliveryType(deliveryType),
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


    // =====================================================
    //  IMPORTANT PART — INVOICE FOR CASH ON DELIVERY
    // =====================================================
    if (paymentMethod === "COD") {

        //  Generate PDF (BUFFER)
        const pdfBuffer = await generateInvoice({
            id: result.id,
            name: result.name,
            phone: result.phone,
            address: result.address,
            state: result.state,
            paymentMethod: "Cash on Delivery",
            paymentStatus: result.paymentStatus,
            subtotal: result.subtotal,
            totalAmount: result.totalAmount,
            deliveryType: result.deliveryType,
            deliveryCharge: result.deliveryCharge,
            createdAt: result.createdAt,

            items: result.items.map((item) => ({
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                total: item.total,
                color: item.color,
                size: item.size,
            })),
        });

        // 🔹 Send email with invoice attached
        await sendEmail({
            to: userEmail,
            subject: "Your Order Invoice",
            templateName: "order-confirmation",
            templateData: {
                name: result.name,
                orderId: result.id,
                totalAmount: result.totalAmount,
                address: `${result.address}, ${result.state}`,
                items: result.items,
                subtotal: result.subtotal,
                shipping: result.deliveryCharge,
                paymentMethod: result.paymentMethod,
            },
            attachments: [
                {
                    filename: `invoice-${result.id}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });
    }


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


//=================== All Order get ===================// 
const getAllOrdersService = async (params: any,
    options: any) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andConditions: Prisma.OrderWhereInput[] = [];
    // ============ Search  =============// 
    if (searchTerm) {
        andConditions.push({
            OR: orderSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }


    //=================== Filters  =================//
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key],
                },
            })),
        });
    }

    const whereCondition: Prisma.OrderWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};


    const orders = await prisma.order.findMany({
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        where: whereCondition,
        include: {
            items: true,
            payment: true,
            shipmentTrackings: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
    });
    const total = await prisma.order.count({ where: whereCondition });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: orders,
    };
};

const getMyOrdersService = async (
    userId: string,
    params: any,
    options: any
) => {
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;
    const andConditions: Prisma.OrderWhereInput[] = [
        { userId }
    ];

    if (searchTerm) {
        andConditions.push({
            OR: orderSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key],
                },
            })),
        });
    }

    const whereCondition: Prisma.OrderWhereInput = { AND: andConditions };
    const orders = await prisma.order.findMany({
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        where: whereCondition,
        include: {
            items: true,
            payment: true,
        },
    });

    const total = await prisma.order.count({ where: whereCondition });
    return {
        meta: {
            page,
            limit,
            total,
        },
        data: orders,
    };

}

const updateOrderStatusService = async (
    orderId: string,
    status: OrderStatus
) => {
    return prisma.order.update({
        where: { id: orderId },
        data: { orderStatus: status },
    });
};

const getOrderTrackingService = async (
    orderId: string,
    userId: string
) => {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId, //  user can see only own order
        },
        include: {
            shipmentTrackings: {
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!order) {
        throw new AppError(404, "Order not found");
    }

    return {
        orderStatus: order.orderStatus,
        shipmentTimeline: order.shipmentTrackings,
        createdAt: order.createdAt,
    };
};

const getSingleOrderService = async (
    orderId: string,
    user: any
) => {
    const whereCondition: Prisma.OrderWhereInput = {
        id: orderId,
    };

    //  If user role is CUSTOMER, restrict access
    if (user.role === "CUSTOMER") {
        whereCondition.userId = user.id;
    }

    const order = await prisma.order.findFirst({
        where: whereCondition,
        include: {
            items: true,
            payment: true,

            //  Shipment Tracking Timeline
            shipmentTrackings: {
                orderBy: {
                    createdAt: "asc",
                },
            },

            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!order) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
    }

    return {
        id: order.id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,

        subtotal: order.subtotal,
        totalAmount: order.totalAmount,

        shippingAddress: {
            name: order.name,
            phone: order.phone,
            state: order.state,
            address: order.address,
        },

        items: order.items,

        //  full tracking history
        shipmentTrackings: order.shipmentTrackings,

        //  current shipment status (latest)
        currentShipmentStatus:
            order.shipmentTrackings.length > 0
                ? order.shipmentTrackings[order.shipmentTrackings.length - 1].status
                : "ORDER_CONFIRMED",

        createdAt: order.createdAt,
    };
};


export const OrderService = {
    createOrderService,
    getAllOrdersService,
    getMyOrdersService,
    updateOrderStatusService,
    getOrderTrackingService,
    getSingleOrderService
}