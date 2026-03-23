import { Product } from './product.types';
import { User } from './user.types';

export interface CartItem {
  id: number;
  cart?: Cart;
  product: Product;
  size: string;
  quantity: number;
  mrpPrice: number;
  sellingPrice: number;
  userId: number;
}

export interface Cart {
  id: number;
  user: User;
  cartItems: CartItem[];
  totalSellingPrice: number;
  totalMrpPrice: number;
  discount: number;
  couponCode: string | null;
  couponDiscountAmount?: number | null;
}
