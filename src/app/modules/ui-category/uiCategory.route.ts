import { Router } from "express";
import { UiCategoryController } from "./uiCategory.controller";
import { fileUploader } from "../../../utiles/fileUploader";
import { UiCategoryValidation } from "./uiCategory.validation";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";


const router = Router();

/**
 * ======================
 * CREATE UI CATEGORY
 * ======================
 */
router.post(
  "/create",
  fileUploader.singleUpload("file"), 
  auth(UserRole.SHOP_MANAGER),
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
router.get("/", auth(UserRole.SHOP_MANAGER),UiCategoryController.getAllUiCategories);

/**
 * ======================
 * UPDATE UI CATEGORY
 * ======================
 */
router.patch(
  "/:id",
  fileUploader.singleUpload("file"),
  auth(UserRole.SHOP_MANAGER),
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
