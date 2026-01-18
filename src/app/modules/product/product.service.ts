import prisma from "../../../shared/prisma";
import { Request as ExpressRequest } from "express";
import { optimizeAndSaveImage } from "../../../utiles/imageOptimizer";
import { CreateProductInput } from "./product.validation";
import { generateUniqueSlug } from "../../../utiles/generateSlug";
import { IOptions, paginationHelper } from "../../../utiles/paginationHelper";
import { Prisma } from "@prisma/client";
import { productSearchableFields } from "./product.constant";
import AppError from "../../middlewares/AppError";
import { StatusCodes } from "http-status-codes";


const createProduct = async (req: ExpressRequest & { files?: Express.Multer.File[] }) => {
    const data = req.body as CreateProductInput;

    // ============= generate slug automatically ================//
    const slug = await generateUniqueSlug(data.name);

    const files = req.files ?? [];
    const productFolder = `products/${slug}`;


    let imageUrls: string[] = [];
    if (files?.length) {
        const baseUrl = `${req.protocol}://${req.get("host")}`;

        for (const file of files) {
            const filename = await optimizeAndSaveImage(file, productFolder);
            imageUrls.push(
                `${baseUrl}/uploads/${productFolder}/${filename}`
            );
        }
    }


    return prisma.product.create({
        data: {
            name: data.name,
            slug,
            sku: data.sku,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            stockQuantity: data.stockQuantity,
            stockStatus: data.stockStatus,
            shortDescription: data.shortDescription,
            fullDescription: data.fullDescription,

            // ====== Images ======
            images: {
                create: imageUrls.map((url) => ({ url })),
            },

            // ===== Categories =====
            categories: data.categories
                ? {
                    create: data.categories.map((category) => ({
                        category: {
                            connectOrCreate: {
                                where: { id: category },
                                create: { id: category, name: category },
                            },
                        },
                    })),
                }
                : undefined,

            // ===== SubCategories =====
            subCategories: data.subCategories
                ? {
                    create: data.subCategories.map((subCategory: any) => {
                        if (typeof subCategory === "string") {
                            return {
                                subCategory: {
                                    connectOrCreate: {
                                        where: { id: subCategory },
                                        create: { id: subCategory, name: subCategory },
                                    },
                                },
                            };
                        } else {
                            // it's an object with id, name, parentId
                            return {
                                subCategory: {
                                    connectOrCreate: {
                                        where: { id: subCategory.id },
                                        create: {
                                            id: subCategory.id,
                                            name: subCategory.name,
                                            parentId: subCategory.parentId || null,
                                        },
                                    },
                                },
                            };
                        }
                    }),
                }
                : undefined,


            // ===== Variants =====
            variants: data.variants
                ? {
                    create: data.variants.map((variant) => ({
                        color: variant.color,
                        size: variant.size,
                        quantity: variant.quantity ?? 0,
                    })),
                }
                : undefined,

            // ===== Tags =====
            tags: data.tags
                ? {
                    connectOrCreate: data.tags.map((tagName) => ({
                        where: { name: tagName },
                        create: { name: tagName },
                    })),
                }
                : undefined,

            // ===== Additional Info =====
            additionalInformation: data.additionalInformation
                ? {
                    create: data.additionalInformation.map((info) => ({
                        label: info.label,
                        value: info.value,
                    })),
                }
                : undefined,
        },
        include: {
            categories: true,
            subCategories: true,
            variants: true,
            images: true,
            additionalInformation: true,
            tags: true,
        }
    });
};

const getProducts = async (params: any, options: IOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
    const { searchTerm, category, subCategory, ...filterData } = params;

    const andConditions: Prisma.ProductWhereInput[] = [];
    if (searchTerm) {
        andConditions.push({
            OR: productSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive"
                }
            }))
        })
    }
    if (category) {
        andConditions.push({
            categories: {
                some: {
                    categoryId: category,
                },
            },
        });
    }
    if (subCategory) {
        andConditions.push({
            subCategories: {
                some: {
                    subCategoryId: subCategory,
                },
            },
        });
    }
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    }


    const whereCondition: Prisma.ProductWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};
    const result = await prisma.product.findMany({
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        },
        where: whereCondition,
        include: {
            categories: true,
            subCategories: true,
            variants: true,
            images: true,
            additionalInformation: true,
            tags: true,
        }
    });
    const total = await prisma.product.count({ where: whereCondition });
    return {
        meta: {
            page,
            limit,
            total,
        },
        data: result,
    };
}

const getProductBySlug = async (slug: string) => {
    const product = await prisma.product.findUnique({
        where: {
            slug,
        },
        include: {
            categories: true,
            subCategories: true,
            variants: true,
            images: true,
            tags: true,
            additionalInformation: true,
        },
    });

    if (!product) {
        throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
    }

    return product;
};


const deleteProduct = async (productId: string) => {
    // 1. Delete related categories
    await prisma.productCategory.deleteMany({ where: { productId } });

    // 2. Delete related subcategories
    await prisma.productSubCategory.deleteMany({ where: { productId } });

    // 3. Delete variants
    await prisma.variant.deleteMany({ where: { productId } });

    // 4. Delete product images
    await prisma.productImage.deleteMany({ where: { productId } });

    // 5. Delete additional info
    await prisma.additionalInfo.deleteMany({ where: { productId } });

    // 6. Disconnect product from tags
    await prisma.product.update({
        where: { id: productId },
        data: {
            tags: {
                set: [], // remove all tag associations for this product
            },
        },
    });

    // 7. Delete the product itself
    return prisma.product.delete({
        where: { id: productId },
    });
};

export const ProductService = {
    createProduct,
    getProducts,
    getProductBySlug,
    deleteProduct
}
