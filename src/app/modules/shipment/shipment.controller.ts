import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catchAsync";
import sendResponse from "../../middlewares/sendResponse";
import { ShipmentService } from "./shipment.service";
import { ShipmentStatus } from "@prisma/client";
import AppError from "../../middlewares/AppError";
import { StatusCodes } from "http-status-codes";


const addShipmentTrackingController = catchAsync(
    async (req: Request, res: Response) => {

        const { orderId } = req.params;
        const { status, message, location } = req.body;
        console.log("Received shipment tracking request:", { orderId, status, message, location });
        if (!status) {
            throw new AppError(
                StatusCodes.BAD_REQUEST,
                "Shipment status is required"
            );
        }

        if (!Object.values(ShipmentStatus).includes(status)) {
            throw new AppError(
                StatusCodes.BAD_REQUEST,
                "Invalid shipment status"
            );
        }
        const result = await ShipmentService.addShipmentTrackingService(
            orderId,
            status as ShipmentStatus,
            message,
            location
        );

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "Shipment tracking added",
            data: result,
        });
    }
);

const getShipmentTrackingController = catchAsync(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    if (!orderId) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Order ID is required"
      );
    }

    const result =
      await ShipmentService.getShipmentTrackingService(orderId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Shipment tracking fetched successfully",
      data: result,
    });
  }
);

export const ShipmentController = {
    addShipmentTrackingController,
    getShipmentTrackingController,
};

