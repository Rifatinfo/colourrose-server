import { Request, Response } from "express";
import crypto from "crypto";
import { UiCategoryService } from "./uiCategory.service";
import { generateUniqueSlug } from "../../../utiles/generateSlug";
import { optimizeAndSaveImage } from "../../../utiles/imageOptimizer";
import { catchAsync } from "../../middlewares/catchAsync";
import sendResponse from "../../middlewares/sendResponse";
import { uiCategoryFilterableFields } from "./uiCategory.constant";
import pick from "../../../utiles/pick";


// CREATE
const createUiCategory = catchAsync(
    async (req: Request & { file?: Express.Multer.File }, res: Response) => {
        const { name } = req.body;

        const slug = name
            ? await generateUniqueSlug(name.trim())
            : `ui-category-${crypto.randomBytes(4).toString("hex")}`;

        let avatarUrl: string | null = null;

        if (req.file) {
            const folder = `ui-categories/${slug}`;
            const filename = await optimizeAndSaveImage(req.file, folder);
            avatarUrl = `/uploads/${folder}/${filename}`;
        }

        const result = await UiCategoryService.create({
            name,
            avatar: avatarUrl ?? undefined,
        });

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "UI Category created successfully!",
            data: result
        })
    });

// READ
const getAllUiCategories = async (req: Request, res: Response) => {
    const filters = pick(req.query, uiCategoryFilterableFields) // searching , filtering
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]) // pagination and sorting
    const result = await UiCategoryService.getAllFromDB(filters, options);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "UI Categories retrieved successfully!",
        meta: result.meta,
        data: result.data
    })
};

// UPDATE
const updateUiCategory = catchAsync(
    async (req: Request & { file?: Express.Multer.File }, res: Response) => {
        const { id } = req.params;
        const { name } = req.body;

        let avatarUrl: string | undefined;

        if (req.file) {
            const slug = name
                ? await generateUniqueSlug(name.trim())
                : crypto.randomBytes(4).toString("hex");

            const folder = `ui-categories/${slug}`;
            const filename = await optimizeAndSaveImage(req.file, folder);
            avatarUrl = `/uploads/${folder}/${filename}`;
        }

        const result = await UiCategoryService.update(id, {
            ...(name && { name }),
            ...(avatarUrl && { avatar: avatarUrl }),
        });

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "UI Category updated successfully!",
            data: result
        })
    });

// DELETE (SOFT)
const deleteUiCategory = async (req: Request, res: Response) => {
    const { id } = req.params;

    await UiCategoryService.remove(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "UI Category deleted successfully!",
        data: null
    })
};

export const UiCategoryController = {
    createUiCategory,
    getAllUiCategories,
    updateUiCategory,
    deleteUiCategory,
};
