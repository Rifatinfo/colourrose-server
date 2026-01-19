
export interface DeliveryInfo {
  name: string;
  phone: string;
  state: string;
  address: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type PaymentMethod = "COD" | "SSLCOMMERZ";

export interface CheckoutBody {
  deliveryInfo: DeliveryInfo;
  cartItems: CartItem[];
  paymentMethod: PaymentMethod;
}

