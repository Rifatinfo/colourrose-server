import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { ShopController } from './shop.controller';
import { shopValidationSchemas } from './shop.validation';

const router = express.Router();

router.get(
    '/',
    auth(UserRole.SHOP_MANAGER),
    ShopController.getAllFromDB
);

router.get(
    '/:id',
    auth(UserRole.SHOP_MANAGER),
    ShopController.getByIdFromDB
);

router.patch(
    '/:id',
    auth(UserRole.SHOP_MANAGER),
    validateRequest(shopValidationSchemas.update),
    ShopController.updateIntoDB
);

router.delete(
    '/:id',
    auth(UserRole.SHOP_MANAGER),
    ShopController.deleteFromDB
);

router.delete(
    '/soft/:id',
    auth(UserRole.SHOP_MANAGER),
    ShopController.softDeleteFromDB
);

export const ShopRoutes = router;