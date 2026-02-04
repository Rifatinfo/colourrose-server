import express from "express";
import { UiSubCategoryController } from "./uiSubCategory.controller";
import { UiSubCategoryValidation } from "./uiSubCategory.validation";
import { fileUploader } from "../../../utiles/fileUploader";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// CREATE
router.post(
  "/create",
  fileUploader.singleUpload("file"),
  auth(UserRole.SHOP_MANAGER),
  (req, _res, next) => {
    try {
      if (!req.body?.data) throw new Error("UiSubCategory data missing");

      const parsed = JSON.parse(req.body.data);
      req.body = UiSubCategoryValidation.createUiSubCategoryValidationSchema.parse(parsed);

      next();
    } catch (error) {
      next(error);
    }
  },
  UiSubCategoryController.createUiSubCategory
);

// GET ALL
router.get("/", auth(UserRole.SHOP_MANAGER),UiSubCategoryController.getAllUiSubCategories);

// UPDATE
router.patch(
  "/:id",
  fileUploader.singleUpload("file"),
  (req, _res, next) => {
    try {
      if (req.body?.data) {
        const parsed = JSON.parse(req.body.data);
        req.body = UiSubCategoryValidation.updateUiSubCategoryValidationSchema.parse(parsed);
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  UiSubCategoryController.updateUiSubCategory
);

// DELETE
router.delete("/:id", auth(UserRole.SHOP_MANAGER),UiSubCategoryController.deleteUiSubCategory);

export const UiSubCategoryRoutes = router;
