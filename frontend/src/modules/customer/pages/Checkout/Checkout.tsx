import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  Radio,
  TextField,
} from "@mui/material";
import { teal } from "@mui/material/colors";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import { deleteItem, fetchUserCart } from "../../../State/Cart/cartSlice";
import { applyCoupon } from "../../../State/Cart/applyCoupon";
import { createCheckoutOrder, orderSummary, productsList } from "../../../State/Backend/MasterApiThunks";
import AddressForm from "./AddressForm";
import AddressCard from "./AddressCard";
import { Address } from "../../../State/Types/userType";
import { addUserAddress, getUserProfile } from "../../../State/CustomerLogin/CustomerLogin";
import { toggleWishlistProduct } from "../../../State/Wishlist/wishlistSlice";

type PaymentOption = "PHONEPE" | "COD";

type CheckoutStep = "BAG" | "ADDRESS" | "PAYMENT";

interface ShippingAddressForm {
  name: string;
  mobileNumber: string;
  address: string;
  locality: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
}

const emptyAddressForm = (
  customer?: { fullName?: string; mobileNumber?: string } | null,
): ShippingAddressForm => ({
  name: customer?.fullName || "",
  mobileNumber: customer?.mobileNumber || "",
  address: "",
  locality: "",
  street: "",
  city: "",
  state: "",
  pinCode: "",
});

const matchesAddress = (left: ShippingAddressForm, right?: Partial<ShippingAddressForm> | null) => {
  if (!right) return false;
  const normalize = (value?: string | null) => (value || "").trim().toLowerCase();
  return (
    normalize(left.name) === normalize(right.name) &&
    normalize(left.mobileNumber) === normalize(right.mobileNumber) &&
    normalize(left.address) === normalize(right.address) &&
    normalize(left.street) === normalize(right.street) &&
    normalize(left.locality) === normalize(right.locality) &&
    normalize(left.city) === normalize(right.city) &&
    normalize(left.state) === normalize(right.state) &&
    normalize(left.pinCode) === normalize(right.pinCode)
  );
};

const resolveStep = (segment?: string | null): CheckoutStep => {
  switch ((segment || "").toLowerCase()) {
    case "cart":
      return "BAG";
    case "address":
      return "ADDRESS";
    case "payment":
      return "PAYMENT";
    default:
      return "BAG";
  }
};

const Checkout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const customer = useAppSelector((state) => state.customerAuth.user);
  const { cart, loading } = useAppSelector((state) => state.cart);
  const masterApi = useAppSelector((state) => state.masterApi);

  const pathStep = location.pathname.split("/")[2];
  const currentStep = resolveStep(pathStep);

  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>("PHONEPE");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<ShippingAddressForm>(emptyAddressForm(null));
  const [couponCode, setCouponCode] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("auth_jwt") : null;
    if (!customer && !token) {
      navigate("/login");
      return;
    }
    if (customer) {
      dispatch(fetchUserCart());
    }
  }, [customer, dispatch, navigate]);

  useEffect(() => {
    if (customer) {
      setAddressForm((prev) => ({
        ...prev,
        name: prev.name || customer.fullName || "",
        mobileNumber: prev.mobileNumber || customer.mobileNumber || "",
      }));
    }
  }, [customer]);

  const savedAddresses = customer?.addresses || [];
  const currentSummary = masterApi.responses.orderSummary;
  const productListResponse = masterApi.responses.productsList;

  useEffect(() => {
    if (!savedAddresses.length) return;
    if (useManualAddress) return;
    if (selectedAddressId !== null) return;
    const firstAddress = savedAddresses[0];
    setSelectedAddressId(firstAddress.id || null);
    setAddressForm({
      name: firstAddress.name || customer?.fullName || "",
      mobileNumber: firstAddress.mobileNumber || customer?.mobileNumber || "",
      address: firstAddress.address || "",
      locality: firstAddress.locality || "",
      street: firstAddress.street || "",
      city: firstAddress.city || "",
      state: firstAddress.state || "",
      pinCode: firstAddress.pinCode || "",
    });
  }, [customer, savedAddresses, selectedAddressId, useManualAddress]);

  const cartItems = cart?.cartItems || [];
  const selectedItems = cartItems.filter((item: any) => selectedItemIds.includes(item.id));
  const selectedMrp = selectedItems.reduce((sum: number, item: any) => sum + (item?.mrpPrice ?? 0), 0);
  const selectedSelling = selectedItems.reduce((sum: number, item: any) => sum + (item?.sellingPrice ?? 0), 0);

  const totalMrp = currentSummary?.priceBreakdown?.totalMRP ?? cart?.totalMrpPrice ?? 0;
  const totalSelling =
    currentSummary?.priceBreakdown?.totalSellingPrice ?? cart?.totalSellingPrice ?? 0;
  const discount = currentSummary?.priceBreakdown?.totalDiscount ?? totalMrp - totalSelling;
  const itemCount = currentSummary?.orderItems?.length ?? cartItems.length ?? 0;
  const selectedItemCount = selectedItemIds.length || itemCount;
  const selectedPriceMrp = selectedItemIds.length ? selectedMrp : totalMrp;
  const selectedPriceSelling = selectedItemIds.length ? selectedSelling : totalSelling;
  const selectedDiscount = selectedItemIds.length ? selectedMrp - selectedSelling : discount;

  useEffect(() => {
    const ids = cartItems.map((item: any) => item?.id).filter(Boolean) as number[];
    setSelectedItemIds((prev) => {
      if (!prev.length) return ids;
      const next = prev.filter((id) => ids.includes(id));
      return next.length ? next : ids;
    });
  }, [cartItems]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setSubmitError("Please enter a coupon code.");
      return;
    }
    setSubmitError(null);
    try {
      await dispatch(
        applyCoupon({
          apply: true,
          code: couponCode.trim(),
          orderValue: selectedPriceSelling,
        }),
      ).unwrap();
      await dispatch(fetchUserCart());
    } catch (error: any) {
      setSubmitError(typeof error === "string" ? error : "Failed to apply coupon.");
    }
  };

  const allSelected = cartItems.length > 0 && selectedItemIds.length === cartItems.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds([]);
      return;
    }
    const ids = cartItems.map((item: any) => item?.id).filter(Boolean) as number[];
    setSelectedItemIds(ids);
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const handleRemoveSelected = async () => {
    const ids = selectedItemIds.length
      ? selectedItemIds
      : (cartItems.map((item: any) => item?.id).filter(Boolean) as number[]);
    if (!ids.length) return;
    await Promise.all(ids.map((id) => dispatch(deleteItem({ cartItemId: id }))));
    dispatch(fetchUserCart());
  };

  const handleMoveSelectedToWishlist = async () => {
    const items = selectedItemIds.length
      ? cartItems.filter((item: any) => selectedItemIds.includes(item.id))
      : cartItems;
    if (!items.length) return;
    await Promise.all(
      items.map((item: any) => {
        const productId = item?.product?.id;
        if (!productId) return Promise.resolve();
        return dispatch(toggleWishlistProduct(productId));
      }),
    );
    await Promise.all(items.map((item: any) => dispatch(deleteItem({ cartItemId: item.id }))));
    dispatch(fetchUserCart());
  };

  const paymentOptions = useMemo(
    () => [
      { id: "COD" as const, title: "Cash On Delivery (Cash/UPI)", sub: "Pay at delivery time" },
      { id: "PHONEPE" as const, title: "UPI (PhonePe)", sub: "Pay online using UPI" },
    ],
    [],
  );

  const goToStep = (step: CheckoutStep) => {
    const path = step === "BAG" ? "cart" : step.toLowerCase();
    navigate(`/checkout/${path}`);
  };

  useEffect(() => {
    if (!cartItems.length) return;
    const categoryId = cartItems[0]?.product?.category?.categoryId;
    dispatch(
      productsList({
        category: categoryId || undefined,
        pageNumber: 0,
      }),
    );
  }, [dispatch, cartItems[0]?.product?.category?.categoryId, cartItems.length]);


  const onAddressChange = (field: keyof ShippingAddressForm, value: string) => {
    if (!useManualAddress) {
      setUseManualAddress(true);
      setSelectedAddressId(null);
    }
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectSavedAddress = (address: Address) => {
    setUseManualAddress(false);
    setSelectedAddressId(address.id || null);
    setAddressForm({
      name: address.name || customer?.fullName || "",
      mobileNumber: address.mobileNumber || customer?.mobileNumber || "",
      address: address.address || "",
      locality: address.locality || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      pinCode: address.pinCode || "",
    });
  };

  const validateAddress = () => {
    if (!addressForm.name.trim()) return "Name is required";
    if (!/^[0-9]{10}$/.test(addressForm.mobileNumber.trim())) return "Mobile number must be 10 digits";
    if (!addressForm.address.trim()) return "Address is required";
    if (!addressForm.city.trim()) return "City is required";
    if (!addressForm.state.trim()) return "State is required";
    if (!/^[0-9]{6}$/.test(addressForm.pinCode.trim())) return "Pincode must be 6 digits";
    return null;
  };

  const fetchSummary = async (shippingDetails: ShippingAddressForm) => {
    try {
      await dispatch(
        orderSummary({
          recipientName: shippingDetails.name.trim(),
          mobileNumber: shippingDetails.mobileNumber.trim(),
          fullAddress: shippingDetails.address.trim(),
          pinCode: shippingDetails.pinCode.trim(),
          deliveryInstructions: shippingDetails.locality.trim(),
        }),
      ).unwrap();
    } catch {
    }
  };

  useEffect(() => {
    const validationError = validateAddress();
    if (!cartItems.length || validationError) return;
    const timer = setTimeout(() => {
      fetchSummary(addressForm);
    }, 350);
    return () => clearTimeout(timer);
  }, [addressForm, cartItems.length]);

  const handleSaveAddress = async () => {
    const validationError = validateAddress();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);
    setSavingAddress(true);
    try {
      const response = await dispatch(addUserAddress(addressForm as any)).unwrap();
      const nextAddresses = response?.addresses || [];
      const savedAddress =
        nextAddresses.find((address: Address) => matchesAddress(addressForm, address)) ||
        nextAddresses[nextAddresses.length - 1];

      await dispatch(getUserProfile()).unwrap();

      if (savedAddress) {
        handleSelectSavedAddress(savedAddress);
      } else {
        setUseManualAddress(false);
      }
    } catch (e: any) {
      setSubmitError(typeof e === "string" ? e : "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitError(null);

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      setSubmitError("Your cart is empty.");
      return;
    }

    const addressError = validateAddress();
    if (addressError) {
      setSubmitError(addressError);
      goToStep("ADDRESS");
      return;
    }

    setSubmitting(true);
    try {
      let shippingDetails = {
        name: addressForm.name.trim(),
        mobileNumber: addressForm.mobileNumber.trim(),
        address: addressForm.address.trim(),
        locality: addressForm.locality.trim(),
        street: addressForm.street.trim() || addressForm.address.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pinCode: addressForm.pinCode.trim(),
      };

      if (useManualAddress) {
        const response = await dispatch(addUserAddress(shippingDetails as any)).unwrap();
        const nextAddresses = response?.addresses || [];
        const savedAddress =
          nextAddresses.find((address: Address) => matchesAddress(shippingDetails, address)) ||
          nextAddresses[nextAddresses.length - 1];

        await dispatch(getUserProfile()).unwrap();

        if (savedAddress) {
          handleSelectSavedAddress(savedAddress);
          shippingDetails = {
            name: savedAddress.name.trim(),
            mobileNumber: savedAddress.mobileNumber.trim(),
            address: savedAddress.address.trim(),
            locality: savedAddress.locality.trim(),
            street: (savedAddress.street || savedAddress.address).trim(),
            city: savedAddress.city.trim(),
            state: savedAddress.state.trim(),
            pinCode: savedAddress.pinCode.trim(),
          };
        }
      }

      const payload = {
        shippingAddress: shippingDetails,
        paymentMethod,
      };

      const response = await dispatch(createCheckoutOrder(payload)).unwrap();
      await dispatch(getUserProfile()).unwrap();
      await dispatch(fetchUserCart());

      const createdOrderId = response?.orderId;
      const paymentUrl = response?.paymentUrl || response?.payment_link_url || response?.paymentLinkUrl;
      if (paymentUrl) {
        window.location.assign(paymentUrl);
        return;
      }

      if (createdOrderId) {
        navigate(`/account/orders/${createdOrderId}`, {
          state: { successMessage: "Order placed successfully." },
        });
        return;
      }

      navigate("/account/orders");
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.message || "Failed to create payment order";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBagContinue = () => {
    if (!cartItems.length) {
      setSubmitError("Your bag is empty.");
      return;
    }
    setSubmitError(null);
    goToStep("ADDRESS");
  };

  const handleAddressContinue = () => {
    const addressError = validateAddress();
    if (addressError) {
      setSubmitError(addressError);
      return;
    }
    setSubmitError(null);
    goToStep("PAYMENT");
  };

  const handleBack = () => {
    if (currentStep === "PAYMENT") {
      goToStep("ADDRESS");
      return;
    }
    if (currentStep === "ADDRESS") {
      goToStep("BAG");
      return;
    }
    const lastPath =
      typeof window !== "undefined"
        ? sessionStorage.getItem("last_non_checkout_path")
        : null;
    if (lastPath && !lastPath.startsWith("/checkout")) {
      navigate(lastPath);
      return;
    }
    navigate("/");
  };

  const steps: CheckoutStep[] = ["BAG", "ADDRESS", "PAYMENT"];
  const stepIndex = steps.indexOf(currentStep);

   
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <div className="flex items-center justify-center gap-4 text-[11px] sm:text-xs uppercase tracking-[0.35em]">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4">
                <span
                  className={`font-semibold ${
                    index === stepIndex
                      ? "text-teal-600"
                      : index < stepIndex
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <span className="h-px w-10 sm:w-16 border-t border-dashed border-gray-300" />
                )}
              </div>
            ))}
          </div>
          <span className="w-12" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {currentStep === "BAG" && (
              <div className="space-y-4">
               
                <div className="flex items-center justify-between border-b pb-3 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-rose-500"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                    <span>{selectedItemIds.length}/{itemCount} ITEMS SELECTED</span>
                  </div>
                  <div className="flex gap-6 text-xs text-gray-500">
                    <button type="button" className="hover:text-gray-900" onClick={handleRemoveSelected}>
                      REMOVE
                    </button>
                    <button type="button" className="hover:text-gray-900" onClick={handleMoveSelectedToWishlist}>
                      MOVE TO WISHLIST
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {cartItems.map((item: any) => {
                    const product = item.product || {};
                    const productImage = product?.images?.[0] || "/no-image.png";
                    const productTitle = product?.title || "Product";
                    const brand = product?.brand || "";
                    const mrpPrice = item?.mrpPrice ?? product?.mrpPrice ?? 0;
                    const sellingPrice = item?.sellingPrice ?? product?.sellingPrice ?? 0;
                    const offPercent = mrpPrice > sellingPrice && mrpPrice > 0
                      ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
                      : 0;
                    return (
                      <div key={item.id} className="relative flex gap-4 rounded-lg border border-gray-200 p-4">
                        <div className="absolute right-3 top-3">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-700"
                            onClick={() => dispatch(deleteItem({ cartItemId: item.id }))}
                          >
                            x
                          </button>
                        </div>
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-rose-500"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                          />
                        </div>
                        <div className="h-24 w-20 rounded-md overflow-hidden border bg-gray-50">
                          <img src={productImage} alt={productTitle} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-gray-800">{brand}</p>
                          <p className="text-sm text-gray-700">{productTitle}</p>
                          <p className="text-xs text-gray-500">Sold by: {product?.sellerName || "Seller"}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-700 mt-2">
                            <span className="border rounded px-2 py-0.5">Size: {item.size || "OS"}</span>
                            <span className="border rounded px-2 py-0.5">Qty: {item.quantity}</span>
                          </div>
                          <div className="mt-2 text-sm font-semibold text-gray-900">
                            Rs {sellingPrice}
                            {mrpPrice > sellingPrice && (
                              <span className="text-xs text-gray-400 line-through ml-2">Rs {mrpPrice}</span>
                            )}
                            {offPercent > 0 && (
                              <span className="text-xs text-rose-500 ml-2">{offPercent}% OFF</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">Delivery by {currentSummary?.estimatedDeliveryDate || "--"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === "ADDRESS" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Select Delivery Address</h2>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setUseManualAddress(true);
                      setSelectedAddressId(null);
                      setAddressForm(emptyAddressForm(customer));
                    }}
                  >
                    Add New Address
                  </Button>
                </div>

                <div className="space-y-3">
                  {savedAddresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      selected={!useManualAddress && selectedAddressId === address.id}
                      onSelect={handleSelectSavedAddress}
                    />
                  ))}
                </div>

                {(useManualAddress || savedAddresses.length === 0) && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-rose-500">Add New Address</p>
                    <AddressForm value={addressForm} onChange={onAddressChange} />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">Save this address to your profile before continuing.</p>
                      <Button variant="outlined" disabled={savingAddress || submitting} onClick={handleSaveAddress}>
                        {savingAddress ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="contained"
                    onClick={handleAddressContinue}
                    sx={{ bgcolor: teal[600], "&:hover": { bgcolor: teal[800] } }}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {currentStep === "PAYMENT" && (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-12">
                    <div className="md:col-span-4 border-r bg-gray-50">
                      <div className="divide-y">
                        {paymentOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            className={`w-full text-left px-4 py-3 text-sm font-semibold ${
                              paymentMethod === opt.id ? "bg-white text-rose-600 border-l-4 border-rose-500" : "text-gray-700"
                            }`}
                            onClick={() => setPaymentMethod(opt.id)}
                          >
                            {opt.id === "COD" ? "Cash On Delivery" : "UPI (Pay via PhonePe)"}
                          </button>
                        ))}
                        <div className="px-4 py-3 text-sm text-gray-400">Credit/Debit Card</div>
                        <div className="px-4 py-3 text-sm text-gray-400">Wallets</div>
                        <div className="px-4 py-3 text-sm text-gray-400">Pay Later</div>
                        <div className="px-4 py-3 text-sm text-gray-400">EMI</div>
                        <div className="px-4 py-3 text-sm text-gray-400">Net Banking</div>
                      </div>
                    </div>
                    <div className="md:col-span-8 p-4">
                      <div className="flex items-start gap-3">
                        <Radio
                          checked={paymentMethod === "COD"}
                          onChange={() => setPaymentMethod("COD")}
                          sx={{ "&.Mui-checked": { color: teal[600] } }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Cash On Delivery (Cash/UPI)</p>
                          <p className="text-xs text-gray-500">Pay when your order is delivered.</p>
                        </div>
                      </div>
                      <Divider className="my-4" />
                      <div className="flex items-start gap-3">
                        <Radio
                          checked={paymentMethod === "PHONEPE"}
                          onChange={() => setPaymentMethod("PHONEPE")}
                          sx={{ "&.Mui-checked": { color: teal[600] } }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">UPI (PhonePe)</p>
                          <p className="text-xs text-gray-500">You will be redirected to PhonePe to complete payment.</p>
                        </div>
                      </div>
                      {paymentMethod === "PHONEPE" && (
                        <Alert className="mt-4" severity="info">
                          PhonePe payment create hone ke baad aap payment page par redirect ho jaoge.
                        </Alert>
                      )}
                      {paymentMethod === "COD" && (
                        <Alert className="mt-4" severity="info">
                          COD order confirm hone ke baad shipping process start hoga.
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {currentStep === "BAG" && (
                <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Coupons</p>
                  <div className="flex gap-2">
                    <TextField
                      size="small"
                      placeholder="Apply Coupons"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      fullWidth
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                    />
                    <Button variant="outlined" size="small" onClick={handleApplyCoupon}>Apply</Button>
                  </div>
                </div>
              )}

               

              <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase">Price Details ({selectedItemCount} Item)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total MRP</span>
                    <span>Rs {selectedPriceMrp}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount on MRP</span>
                    <span>-Rs {selectedDiscount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span>Rs {currentSummary?.priceBreakdown?.platformFee ?? 0}</span>
                  </div>
                </div>
                <Divider />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>Rs {selectedPriceSelling}</span>
                </div>
              </div>

              {(submitError || masterApi.error) && <Alert severity="error">{submitError || masterApi.error}</Alert>}

              {currentStep === "BAG" && (
                <div className="flex items-center gap-3">
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleBack}
                    sx={{
                      py: 1.6,
                      borderColor: "#ff3f6c",
                      color: "#ff3f6c",
                      fontWeight: "bold",
                      "&:hover": { borderColor: "#e6375f", color: "#e6375f" },
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleBagContinue}
                    sx={{
                      py: 1.6,
                      bgcolor: "#ff3f6c",
                      fontWeight: "bold",
                      "&:hover": { bgcolor: "#e6375f" },
                    }}
                  >
                    Continue to Address
                  </Button>
                </div>
              )}

              {currentStep === "ADDRESS" && (
                <div className="flex items-center gap-3">
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => goToStep("BAG")}
                    sx={{
                      py: 1.6,
                      borderColor: "#ff3f6c",
                      color: "#ff3f6c",
                      fontWeight: "bold",
                      "&:hover": { borderColor: "#e6375f", color: "#e6375f" },
                    }}
                  >
                    Back
                  </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddressContinue}
                  sx={{
                    py: 1.6,
                    bgcolor: "#ff3f6c",
                    fontWeight: "bold",
                    "&:hover": { bgcolor: "#e6375f" },
                  }}
                >
                  Continue
                </Button>
                </div>
              )}

              {currentStep === "PAYMENT" && (
                <div className="flex items-center gap-3">
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => goToStep("ADDRESS")}
                    sx={{
                      py: 1.6,
                      borderColor: "#ff3f6c",
                      color: "#ff3f6c",
                      fontWeight: "bold",
                      "&:hover": { borderColor: "#e6375f", color: "#e6375f" },
                    }}
                  >
                    Back
                  </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handlePlaceOrder}
                  disabled={loading || submitting || masterApi.loading}
                  sx={{
                    py: 1.6,
                    bgcolor: "#ff3f6c",
                    fontWeight: "bold",
                    "&:hover": { bgcolor: "#e6375f" },
                  }}
                >
                  {submitting || masterApi.loading ? <CircularProgress size={20} color="inherit" /> : paymentMethod === "COD" ? "Place COD Order" : "Proceed to PhonePe"}
                </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

