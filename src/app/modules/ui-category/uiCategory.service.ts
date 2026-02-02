import { Prisma } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IOptions, paginationHelper } from "../../../utiles/paginationHelper";
import {
  CreateUiCategoryInput,
  UpdateUiCategoryInput,
} from "./uiCategory.interface";
import { uiCategorySearchableFields } from "./uiCategory.constant";

//============= CREATE ================//
const create = async (data: CreateUiCategoryInput) => {
  return prisma.uiCategory.create({
    data,
  });
};

//============= READ (ALL) ================//
const getAllFromDB = async (params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UiCategoryWhereInput[] = [];

  // 🔍 Search
  if (searchTerm) {
    andConditions.push({
      OR: uiCategorySearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // 🎯 Filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // Always active only
  andConditions.push({
    isActive: true,
  });

  const whereConditions: Prisma.UiCategoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // 📄 Query
  const data = await prisma.uiCategory.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: sortBy
      ? {
          [sortBy]: sortOrder,
        }
      : {
          createdAt: "desc",
        },
  });

  const total = await prisma.uiCategory.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};

//============= UPDATE ================//
const update = async (id: string, data: UpdateUiCategoryInput) => {
  return prisma.uiCategory.update({
    where: { id },
    data,
  });
};

//============= DELETE (SOFT DELETE) ================//
const remove = async (id: string) => {
  return prisma.uiCategory.delete({ where: { id } });
};

export const UiCategoryService = {
  create,
  getAllFromDB,
  update,
  remove,
};
