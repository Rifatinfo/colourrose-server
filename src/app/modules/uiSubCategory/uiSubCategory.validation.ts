import { z } from "zod";

const createUiSubCategoryValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const updateUiSubCategoryValidationSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const UiSubCategoryValidation = {
  createUiSubCategoryValidationSchema,
  updateUiSubCategoryValidationSchema,
};
