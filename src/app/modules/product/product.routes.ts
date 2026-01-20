
import express from 'express';
import { ProductController } from './product.controller';
import { fileUploader } from '../../../utiles/fileUploader';
import { createProductSchema } from './product.validation';


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

router.get("/", ProductController.getAll);
router.get("/slug/:slug", ProductController.getProductBySlug);
router.delete("/:productId",  ProductController.deleteProduct);

export const ProductRoutes = router;