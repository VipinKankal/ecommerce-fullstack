import React, { useEffect, useState } from 'react';
import { Alert, Button, Divider, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { applyCoupon } from 'State/features/customer/cart/applyCoupon';
import { deleteItem, fetchUserCart } from 'State/features/customer/cart/slice';
import { CartItem } from 'shared/types/cart.types';

const Cart = () => {
  const [couponCode, setCouponCode] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartState = useAppSelector((state) => state.cart);
  const customer = useAppSelector((state) => state.customerAuth.user);

  useEffect(() => {
    if (customer) dispatch(fetchUserCart());
  }, [dispatch, customer]);

  const cart = cartState.cart;
  const cartItems = cart?.cartItems || [];
  const totalMrp = cart?.totalMrpPrice ?? 0;
  const totalSelling = cart?.totalSellingPrice ?? 0;
  const discount = totalMrp - totalSelling;
  const couponDiscountAmount = cart?.couponDiscountAmount ?? 0;
  const itemCount = cartItems.length;

  const handleCouponAction = async () => {
    const targetCode = (cart?.couponCode || couponCode).trim();
    if (!targetCode) return;

    await dispatch(
      applyCoupon({
        apply: !cart?.couponCode,
        code: targetCode,
      }),
    );
    await dispatch(fetchUserCart());
    if (!cart?.couponCode) {
      setCouponCode('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 text-[11px] sm:text-xs uppercase tracking-[0.35em]">
            {['BAG', 'ADDRESS', 'PAYMENT'].map((step, index) => (
              <div key={step} className="flex items-center gap-4">
                <span
                  className={`font-semibold ${
                    index === 0 ? 'text-teal-600' : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
                {index < 2 && (
                  <span className="h-px w-10 sm:w-16 border-t border-dashed border-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-rose-50/40 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-gray-800">
                Deliver to:{' '}
                <span className="font-semibold">
                  {customer?.addresses?.[0]?.pinCode || '------'}
                </span>
              </p>
              <button
                type="button"
                className="text-xs font-semibold border border-rose-400 text-rose-500 px-3 py-1 rounded"
                onClick={() => navigate('/checkout/address')}
              >
                Change Address
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 px-4 py-4">
              <p className="font-semibold text-sm text-gray-800">
                Available Offers
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Apply a coupon at checkout to unlock your best eligible price.
              </p>
            </div>

            <div className="flex items-center justify-between border-b pb-3 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-rose-500 text-white text-xs">
                  {itemCount}
                </span>
                <span>
                  {itemCount}/{itemCount} ITEMS SELECTED
                </span>
              </div>
              <div className="flex gap-6 text-xs text-gray-500">
                <span>REMOVE</span>
                <span>MOVE TO WISHLIST</span>
              </div>
            </div>

            {cartItems.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                <p className="text-gray-400 font-bold">Your bag is empty.</p>
                <Button onClick={() => navigate('/')} sx={{ mt: 2, fontWeight: 'bold' }}>
                  Start Shopping
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {cartItems.map((item: CartItem) => {
                const product = item.product || {};
                const productImage = product?.images?.[0] || '/no-image.png';
                const productTitle = product?.title || 'Product';
                const brand = product?.brand || '';
                const mrpPrice = item?.mrpPrice ?? product?.mrpPrice ?? 0;
                const sellingPrice =
                  item?.sellingPrice ?? product?.sellingPrice ?? 0;
                const offPercent =
                  mrpPrice > sellingPrice && mrpPrice > 0
                    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
                    : 0;
                return (
                  <div
                    key={item.id}
                    className="relative flex gap-4 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="absolute right-3 top-3">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-700"
                        onClick={() =>
                          dispatch(deleteItem({ cartItemId: item.id }))
                        }
                      >
                        x
                      </button>
                    </div>
                    <div className="h-24 w-20 rounded-md overflow-hidden border bg-gray-50">
                      <img
                        src={productImage}
                        alt={productTitle}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {brand}
                      </p>
                      <p className="text-sm text-gray-700">{productTitle}</p>
                      <p className="text-xs text-gray-500">
                        Sold by: {product?.seller?.sellerName || 'Seller'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-700 mt-2">
                        <span className="border rounded px-2 py-0.5">
                          Size: {item.size || 'OS'}
                        </span>
                        <span className="border rounded px-2 py-0.5">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-gray-900">
                        Rs {sellingPrice}
                        {mrpPrice > sellingPrice && (
                          <span className="text-xs text-gray-400 line-through ml-2">
                            Rs {mrpPrice}
                          </span>
                        )}
                        {offPercent > 0 && (
                          <span className="text-xs text-rose-500 ml-2">
                            {offPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Coupons
                </p>
                {cartState.error && <Alert severity="error">{cartState.error}</Alert>}
                {cart?.couponCode && (
                  <Alert severity="success">
                    Applied coupon <strong>{cart.couponCode}</strong> saving Rs{' '}
                    {couponDiscountAmount}
                  </Alert>
                )}
                <div className="flex gap-2">
                  <TextField
                    size="small"
                    placeholder="Apply Coupon"
                    value={cart?.couponCode || couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    fullWidth
                    disabled={Boolean(cart?.couponCode)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={cartState.loading}
                    onClick={handleCouponAction}
                  >
                    {cart?.couponCode ? 'Remove' : 'Apply'}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Price Details ({itemCount} Item)
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total MRP</span>
                    <span>Rs {totalMrp}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount on MRP</span>
                    <span>-Rs {discount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon Discount</span>
                    <span>-Rs {couponDiscountAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span>Rs 0</span>
                  </div>
                </div>
                <Divider />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>Rs {totalSelling}</span>
                </div>
              </div>

              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/checkout/address')}
                sx={{
                  py: 1.6,
                  bgcolor: '#ff3f6c',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#e6375f' },
                }}
              >
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
