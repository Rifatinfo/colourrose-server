import { Router } from "express";
import { ProductRoutes } from "../modules/product/product.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { OrderRoutes } from "../modules/order/order.routes";
import { PaymentRoutes } from "../modules/payment/payment.routes";


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
        path : "/order",
        route : OrderRoutes
    },
    {
        path : "/payment",
        route : PaymentRoutes
    },
    
]

moduleRouters.forEach((route) => {
    router.use(route.path, route.route)
});


