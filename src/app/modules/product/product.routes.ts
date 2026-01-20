
import express, { NextFunction, Request, Response } from 'express';
import { ProductController } from './product.controller';
import { fileUploader } from '../../../utiles/fileUploader';
import { createProductSchema } from './product.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();


router.post(
    "/create",
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

router.get("/", auth(UserRole.CUSTOMER, UserRole.CUSTOMER, UserRole.ADMIN), ProductController.getAll);
router.get("/slug/:slug", ProductController.getProductBySlug);
router.delete("/:productId", auth(UserRole.ADMIN), ProductController.deleteProduct);

export const ProductRoutes = router;