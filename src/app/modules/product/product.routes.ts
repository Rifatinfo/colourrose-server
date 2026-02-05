
import express from 'express';
import { ProductController } from './product.controller';
import { fileUploader } from '../../../utiles/fileUploader';
import { createProductSchema, updateProductSchema } from './product.validation';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
    "/create",
    auth(UserRole.SHOP_MANAGER),
    fileUploader.multipleUpload("file", 4),
    (req, _res, next) => {
        try {
            if (!req.body?.data) {
                throw new Error("Product data missing");
            }

            const parsed = JSON.parse(req.body.data);
            req.body = createProductSchema.parse(parsed);

            next();
        } catch (error) {
            next(error);
        }
    },
    ProductController.createProduct
);

router.patch(
    "/:id",
    auth(UserRole.SHOP_MANAGER),
    fileUploader.multipleUpload("file", 4),
    (req, _res, next) => {
        try {
            if (!req.body?.data) {
                throw new Error("Product data missing");
            }

            const parsed = JSON.parse(req.body.data);
            req.body = updateProductSchema.parse(parsed);

            next();
        } catch (error) {
            next(error);
        }
    },
    ProductController.updateProduct
);

router.get("/", ProductController.getAll);
router.get("/slug/:slug", ProductController.getProductBySlug);
router.delete("/:productId", auth(UserRole.SHOP_MANAGER, UserRole.ADMIN), ProductController.deleteProduct);
router.get("/best-selling", ProductController.getBestSellingProducts);

export const ProductRoutes = router;



