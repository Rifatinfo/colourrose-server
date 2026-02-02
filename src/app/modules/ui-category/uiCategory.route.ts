import { Router } from "express";
import { UiCategoryController } from "./uiCategory.controller";
import { fileUploader } from "../../../utiles/fileUploader";
import { UiCategoryValidation } from "./uiCategory.validation";


const router = Router();

/**
 * ======================
 * CREATE UI CATEGORY
 * ======================
 */
router.post(
  "/create",
  fileUploader.singleUpload("file"), // 
  (req, _res, next) => {
    try {
      if (!req.body?.data) {
        throw new Error("UI Category data missing");
      }

      const parsed = JSON.parse(req.body.data);
      req.body =
        UiCategoryValidation.createUiCategoryValidationSchema.parse(parsed);

      next();
    } catch (error) {
      next(error);
    }
  },
  UiCategoryController.createUiCategory
);

/**
 * ======================
 * GET ALL UI CATEGORIES
 * ======================
 */
router.get("/", UiCategoryController.getAllUiCategories);

/**
 * ======================
 * UPDATE UI CATEGORY
 * ======================
 */
router.patch(
  "/:id",
  fileUploader.singleUpload("file"),
  (req, _res, next) => {
    try {
      if (req.body?.data) {
        const parsed = JSON.parse(req.body.data);
        req.body =
          UiCategoryValidation.updateUiCategoryValidationSchema.parse(parsed);
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  UiCategoryController.updateUiCategory
);

/**
 * ======================
 * DELETE UI CATEGORY (SOFT)
 * ======================
 */
router.delete(
  "/:id",
  UiCategoryController.deleteUiCategory
);

export const UiCategoryRoutes = router;
