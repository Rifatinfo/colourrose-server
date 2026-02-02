import express from "express";
import { UiSubCategoryController } from "./uiSubCategory.controller";
import { UiSubCategoryValidation } from "./uiSubCategory.validation";
import { fileUploader } from "../../../utiles/fileUploader";

const router = express.Router();

// CREATE
router.post(
  "/create",
  fileUploader.singleUpload("file"),
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
router.get("/", UiSubCategoryController.getAllUiSubCategories);

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
router.delete("/:id", UiSubCategoryController.deleteUiSubCategory);

export const UiSubCategoryRoutes = router;
