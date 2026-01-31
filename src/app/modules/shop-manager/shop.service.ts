import { Admin, Prisma, UserStatus } from "@prisma/client";
import { IOptions, paginationHelper } from "../../../utiles/paginationHelper";
import prisma from "../../../shared/prisma";
import { IShopFilterRequest } from "./shop.interface";
import { shopSearchAbleFields } from "./shop.constant";



const getAllFromDB = async (params: IShopFilterRequest, options: IOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.ShopManagerWhereInput[] = [];

    if (params.searchTerm) {
        andConditions.push({
            OR: shopSearchAbleFields.map(field => ({
                [field]: {
                    contains: params.searchTerm,
                    mode: 'insensitive'
                }
            }))
        })
    };

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    };

    andConditions.push({
        isDeleted: false
    })

    const whereConditions: Prisma.ShopManagerWhereInput = { AND: andConditions }

    const result = await prisma.shopManager.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? {
            [options.sortBy]: options.sortOrder
        } : {
            createdAt: 'desc'
        }
    });

    const total = await prisma.shopManager.count({
        where: whereConditions
    });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
};

const getByIdFromDB = async (id: string): Promise<Admin | null> => {
    const result = await prisma.shopManager.findUnique({
        where: {
            id,
            isDeleted: false
        }
    })

    return result;
};

const updateIntoDB = async (id: string, data: Partial<Admin>): Promise<Admin> => {
    await prisma.shopManager.findUniqueOrThrow({
        where: {
            id,
            isDeleted: false
        }
    });

    const result = await prisma.shopManager.update({
        where: {
            id
        },
        data
    });

    return result;
};

const deleteFromDB = async (id: string): Promise<Admin | null> => {

    await prisma.shopManager.findUniqueOrThrow({
        where: {
            id
        }
    });

    const result = await prisma.$transaction(async (transactionClient) => {
        const shopDeletedData = await transactionClient.shopManager.delete({
            where: {
                id
            }
        });

        await transactionClient.user.delete({
            where: {
                email: shopDeletedData.email
            }
        });

        return shopDeletedData;
    });

    return result;
}


const softDeleteFromDB = async (id: string): Promise<Admin | null> => {
    await prisma.shopManager.findUniqueOrThrow({
        where: {
            id,
            isDeleted: false
        }
    });

    const result = await prisma.$transaction(async (transactionClient) => {
        const shopDeletedData = await transactionClient.shopManager.update({
            where: {
                id
            },
            data: {
                isDeleted: true
            }
        });

        await transactionClient.user.update({
            where: {
                email: shopDeletedData.email
            },
            data: {
                status: UserStatus.DELETED
            }
        });

        return shopDeletedData;
    });

    return result;
}


export const ShopService = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    deleteFromDB,
    softDeleteFromDB
}