import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catchAsync";
import sendResponse from "../../middlewares/sendResponse";
import { StatusCodes } from "http-status-codes";
import { CheckoutService } from "./checkout.service"; 

const checkoutController = catchAsync(
    async (req: Request, res: Response) => {
        const order = await CheckoutService.createCheckout(req);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Order created successfully",
            data: order,
        });
    }
);

export const CheckoutController = {
    checkoutController
};


