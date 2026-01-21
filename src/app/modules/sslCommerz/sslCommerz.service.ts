import axios from "axios"
import httpStatus from "http-status-codes"

import { ISSLCommerz } from "./sslCommerz.interface"
import config from "../../../config"
import AppError from "../../middlewares/AppError"

const sslPaymentInit = async (payload: ISSLCommerz) => {

    try {
        const data = {
            store_id: config.SSL_STORE_ID,
            store_passwd: config.SSL_STORE_PASS,
            total_amount: payload.totalAmount,
            currency: "BDT",
            tran_id: payload.transactionId,
            success_url: `${config.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.totalAmount}&status=success`,
            fail_url: `${config.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.totalAmount}&status=fail`,
            cancel_url: `${config.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.totalAmount}&status=cancel`,
            // ipn_url: "http://localhost:3030/ipn",
            shipping_method: "NO",
            product_name: "Order Payment",
            product_category: "Ecommerce",
            product_profile: "general",

            cus_name: payload.name,
            cus_email: payload.email,
            cus_add1: payload.address,
            cus_city: "Dhaka",
            cus_state: "Dhaka",
            cus_postcode: "1000",
            cus_country: "Bangladesh",
            cus_phone: payload.phone,

            ship_name: payload.name,
            ship_add1: payload.address,
            ship_city: "Dhaka",
            ship_postcode: "1000",
            ship_country: "Bangladesh",
        }

        const response = await axios({
            method: "POST",
            url: config.SSL_PAYMENT_API,
            data: data,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })

        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.log("Payment Error Occured", error);
        throw new AppError(httpStatus.BAD_REQUEST, error.message)
    }
}

export const SSLService = {
    sslPaymentInit
}