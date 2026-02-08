import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catchAsync";
import sendResponse from "../../middlewares/sendResponse";
import { StatusCodes } from "http-status-codes";
import { OrderService } from "./order.service";
import AppError from "../../middlewares/AppError";
import pick from "../../../utiles/pick";
import { orderFilterableFields } from "./order.constant";


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

//=================== all order controllers can be added here =================// 
const getAllOrdersController = catchAsync(
  async (req: Request, res: Response) => {

    const filters = pick(req.query, orderFilterableFields);
    const options = pick(req.query, [
      "page",
      "limit",
      "sortBy",
      "sortOrder",
    ]);

    const result = await OrderService.getAllOrdersService(filters, options);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Orders fetched successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

//======================= My Order Controller ==========================//

const getMyOrdersController = catchAsync(
  async (req: Request & { user?: { id: string } }, res: Response) => {

    if (!req.user?.id) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    const filters = pick(req.query, orderFilterableFields);

    const options = pick(req.query, [
      "page",
      "limit",
      "sortBy",
      "sortOrder",
    ]);

    const result = await OrderService.getMyOrdersService(
      req.user.id,
      filters,
      options
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "My orders fetched successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);


const updateOrderStatusController = catchAsync(async (req: Request, res: Response) => {

  const { orderId } = req.params;
  const { status } = req.body;
  console.log("Received order status update request:", { orderId, status });

  if (!status) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Status is required");
  }
  const result = await OrderService.updateOrderStatusService(orderId, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order status updated",
    data: result,
  });
}
);


const getOrderTrackingController = catchAsync(
  async (req: Request & { user?: { id: string } }, res: Response) => {

    const { orderId } = req.params;

    const result = await OrderService.getOrderTrackingService(
      orderId,
      req.user!.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Order tracking fetched",
      data: result,
    });
  }
);

export const OrderController = {
  createOrderController,
  getAllOrdersController,
  getMyOrdersController,
  updateOrderStatusController,
  getOrderTrackingController
};

