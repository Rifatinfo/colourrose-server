import { Router } from "express";
import { ProductRoutes } from "../modules/product/product.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { CheckoutRoutes } from "../modules/checkout/checkout.routes";


export const router = Router();

const moduleRouters = [
    {
        path : "/product",
        route : ProductRoutes
    },
    {
        path : "/user",
        route : UserRoutes
    },
    {
        path : "/auth",
        route : AuthRoutes
    },
    {
        path : "/checkout",
        route : CheckoutRoutes
    },
    
]

moduleRouters.forEach((route) => {
    router.use(route.path, route.route)
})