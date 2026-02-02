import { Request, Response } from "express";
import { UiSubCategoryService } from "./uiSubCategory.service";
import sendResponse from "../../middlewares/sendResponse";

const createUiSubCategory = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    const data = req.body;

    const result = await UiSubCategoryService.createUiSubCategory(data, req.file);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "UI SubCategory created successfully!",
        data: result
    })
};

const getAllUiSubCategories = async (req: Request, res: Response) => {
    const result = await UiSubCategoryService.getAllFromDB(req.query, req.query as any);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "UI sub Categories retrieved successfully!",
        meta: result.meta,
        data: result.data
    })
};

const updateUiSubCategory = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    const { id } = req.params;

    const result = await UiSubCategoryService.updateUiSubCategory(id, req.body, req.file);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "UI SubCategory updated successfully!",
        data: result
    })
};

const deleteUiSubCategory = async (req: Request, res: Response) => {
    const { id } = req.params;

    await UiSubCategoryService.deleteUiSubCategory(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "UI SubCategory deleted successfully",
        data : null
    });
};

export const UiSubCategoryController = {
    createUiSubCategory,
    getAllUiSubCategories,
    updateUiSubCategory,
    deleteUiSubCategory,
};
