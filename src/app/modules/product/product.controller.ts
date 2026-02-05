import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catchAsync";
import { StatusCodes } from "http-status-codes";
import { ProductService } from "./product.service";
import sendResponse from "../../middlewares/sendResponse";
import pick from "../../../utiles/pick";
import { productFilterableFields } from "./product.constant";

const createProduct = catchAsync(async (req: Request, res: Response) => {
    const product = await ProductService.createProduct(req as Request & { files?: Express.Multer.File[] });

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Product created successfully',
        data: product
    });
})
const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const product = await ProductService.updateProduct(
        req.params.id,
        req as Request & { files?: Express.Multer.File[] }
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Product updated successfully",
        data: product,
    });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
    //================= searching , filtering ================//
    const filters = pick(req.query, productFilterableFields);
    // ================= pagination and sorting =================//
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"])
    const products = await ProductService.getProducts(filters, options);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Products retrieved successfully',
        meta: products.meta,
        data: products.data,
    });
})

const getProductBySlug = catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const product = await ProductService.getProductBySlug(slug);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Product fetched successfully",
        data: product,
    });
});


const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    await ProductService.deleteProduct(productId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Product deleted successfully',
        data: null
    });
});


/*=============================================================================================*/   
//======================= New Controller: Get Best Selling Products  ==========================//
/*=============================================================================================*/

const getBestSellingProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getBestSellingProducts();

  res.status(200).json({
    success: true,
    message: "Best selling products retrieved successfully",
    data: result,
  });
});

export const ProductController = {
    createProduct,
    getAll,
    getProductBySlug,
    deleteProduct,
    getBestSellingProducts,
    updateProduct,
}