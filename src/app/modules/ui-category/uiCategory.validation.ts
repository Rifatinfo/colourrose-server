import { z } from "zod";

/*================= CREATE ====================*/
const createUiCategoryValidationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
});

/*================= UPDATE ====================*/
const updateUiCategoryValidationSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const UiCategoryValidation = {
  createUiCategoryValidationSchema,
  updateUiCategoryValidationSchema,
};
