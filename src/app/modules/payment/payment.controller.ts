import { Request, Response } from "express"
import { catchAsync } from "../../middlewares/catchAsync"
import config from "../../../config";
import { PaymentService } from "./payment.service";
import sendResponse from "../../middlewares/sendResponse";
import { SSLService } from "../sslCommerz/sslCommerz.service";

const successPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;
    const result = await PaymentService.successPayment(query);

    //=============== Redirect user to frontend success page  =================//
    console.log(result);
    console.log(`${config.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=success`)
    return res.redirect(
        `${config.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=success`
    );
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;

    const result = await PaymentService.failPayment(query);

    return res.redirect(
        `${config.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&status=fail`
    );
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;

    const result = await PaymentService.cancelPayment(query);

    return res.redirect(
        `${config.SSL_CANCEL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&status=cancel`
    );
});
const initPayment = catchAsync(async (req: Request & { user?: { id: string } }, res: Response) => {
    const { orderId } = req.params;
    const result = await PaymentService.initPayment(orderId);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Payment initiated successfully",
        data: result,
    });
});

const validatePayment = catchAsync(
    async (req: Request, res: Response) => {
        console.log("sslcommerz ipn url body", req.body);
        await SSLService.validatePayment(req.body)
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Payment Validated Successfully",
            data: null,
        });
    }
);

export const PaymentController = {
    successPayment,
    failPayment,
    cancelPayment,
    initPayment,
    validatePayment,
}