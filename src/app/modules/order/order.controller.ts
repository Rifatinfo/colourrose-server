import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catchAsync";
import sendResponse from "../../middlewares/sendResponse";
import { StatusCodes } from "http-status-codes";
import { OrderService } from "./order.service";
import AppError from "../../middlewares/AppError";


export const createOrderController = catchAsync(
  async (req: Request & { user?: { id: string } }, res: Response) => {

    if (!req.user?.id) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const userId = req.user!.id; 
    const userEmail = req.user!.email;
    const order = await OrderService.createOrderService(userId, userEmail as string, req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  }
);

export const OrderController = {
  createOrderController,
}

