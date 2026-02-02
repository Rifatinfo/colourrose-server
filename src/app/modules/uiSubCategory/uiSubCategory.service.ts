import prisma from "../../../shared/prisma";
import { generateUniqueSlug } from "../../../utiles/generateSlug";
import { optimizeAndSaveImage } from "../../../utiles/imageOptimizer";
import { IOptions, paginationHelper } from "../../../utiles/paginationHelper";
import { IUiSubCategory } from "./uiSubCategory.interface";


const createUiSubCategory = async (payload: IUiSubCategory, file?: Express.Multer.File) => {
  let avatar: string | null = null;

  if (file) {
    const slug = await generateUniqueSlug(payload.name);
    const folder = `ui-sub-categories/${slug}`;
    const filename = await optimizeAndSaveImage(file, folder);
    avatar = `/uploads/${folder}/${filename}`;
  }

  return prisma.uiSubCategory.create({
    data: {
      ...payload,
      avatar,
    },
  });
};

const getAllFromDB = async (params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
  const { searchTerm } = params;

  const where: any = {
    isActive: true,
    ...(searchTerm && { name: { contains: searchTerm, mode: "insensitive" } }),
  };

  const data = await prisma.uiSubCategory.findMany({
    where,
    skip,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
  });

  const total = await prisma.uiSubCategory.count({ where });

  return {
    meta: { page, limit, total },
    data,
  };
};

const updateUiSubCategory = async (id: string, payload: Partial<IUiSubCategory>, file?: Express.Multer.File) => {
  let avatar;

  if (file) {
    const slug = await generateUniqueSlug(payload.name || "subcategory");
    const folder = `ui-sub-categories/${slug}`;
    const filename = await optimizeAndSaveImage(file, folder);
    avatar = `/uploads/${folder}/${filename}`;
  }

  return prisma.uiSubCategory.update({
    where: { id },
    data: {
      ...payload,
      ...(avatar && { avatar }),
    },
  });
};

const deleteUiSubCategory = async (id: string) => {
  return prisma.uiSubCategory.delete({
    where: { id },
  });
};

export const UiSubCategoryService = {
  createUiSubCategory,
  getAllFromDB,
  updateUiSubCategory,
  deleteUiSubCategory,
};
