export const API_ROUTES = {
  home: {
    root: '/',
  },

  auth: {
    signup: '/api/auth/signup',
    sendLoginSignupOtp: '/api/auth/sent/login-signup-otp',
    signin: '/api/auth/signin',
    logout: '/api/auth/logout',
  },

  user: {
    profile: '/api/auth/users/profile',
    profileAlias: '/api/users/profile',
    addresses: '/api/auth/users/addresses',
    addressById: (addressId: number | string) =>
      `/api/auth/users/addresses/${addressId}`,
    deactivate: '/api/auth/users/account/deactivate',
    requestEmailChangeOtp: '/api/auth/users/email/change/request-otp',
    verifyEmailChangeOtp: '/api/auth/users/email/change/verify',
  },

  admin: {
    profile: '/api/admin/profile',
    dashboardSummary: '/api/admin/dashboard/summary',
    auditLogs: '/api/admin/audit-logs',
    users: '/api/admin/users',
    userStatus: (id: number | string, status: string) =>
      `/api/admin/users/${id}/status/${status}`,
    products: '/api/admin/products',
    notifyDemand: '/api/admin/notify-demand',
    inventory: {
      adjust: (productId: number | string) =>
        `/api/admin/inventory/${productId}`,
      movements: (productId: number | string) =>
        `/api/admin/products/${productId}/movements`,
      triggerNotify: (productId: number | string) =>
        `/api/admin/notify-demand/${productId}/trigger`,
    },
    orders: '/api/admin/orders',
    orderActions: {
      confirm: (orderId: number | string) =>
        `/api/admin/orders/${orderId}/confirm`,
      pack: (orderId: number | string) => `/api/admin/orders/${orderId}/pack`,
      ship: (orderId: number | string) => `/api/admin/orders/${orderId}/ship`,
      cancel: (orderId: number | string) =>
        `/api/admin/orders/${orderId}/cancel`,
    },
    payments: '/api/admin/payments',
    salesReport: '/api/admin/reports/sales',
    taxRules: {
      base: '/api/admin/tax-rules',
      publish: (id: number | string) => `/api/admin/tax-rules/${id}/publish`,
      resolve: '/api/admin/tax-rules/resolve',
    },
    hsnMaster: {
      base: '/api/admin/hsn-master',
      byId: (id: number | string) => `/api/admin/hsn-master/${id}`,
      publish: (id: number | string) => `/api/admin/hsn-master/${id}/publish`,
    },
    productTaxReviews: {
      base: '/api/admin/product-tax-reviews',
      byId: (id: number | string) => `/api/admin/product-tax-reviews/${id}`,
    },
    complianceChallans: '/api/admin/compliance/challans',
    complianceNotes: {
      base: '/api/admin/compliance/notes',
      byId: (id: number | string) => `/api/admin/compliance/notes/${id}`,
      impact: (id: number | string) => `/api/admin/compliance/notes/${id}/impact`,
      analytics: '/api/admin/compliance/notes/analytics',
      publish: (id: number | string) =>
        `/api/admin/compliance/notes/${id}/publish`,
      archive: (id: number | string) =>
        `/api/admin/compliance/notes/${id}/archive`,
      attachmentDownload: (id: number | string, attachmentId: string) =>
        `/api/admin/compliance/notes/${id}/attachments/${attachmentId}/download`,
    },
    updateSellerStatus: (id: number | string, status: string) =>
      `/api/admin/seller/${id}/status/${status}`,
    profileAlias: '/api/profile',
    returnExchange: {
      base: '/api/admin/return-exchange',
      review: (requestId: number | string) =>
        `/api/admin/return-exchange/${requestId}/review`,
    },
    returns: {
      base: '/api/admin/returns',
      review: (requestId: number | string) =>
        `/api/admin/returns/${requestId}/review`,
      pickup: (requestId: number | string) =>
        `/api/admin/returns/${requestId}/pickup`,
      receive: (requestId: number | string) =>
        `/api/admin/returns/${requestId}/receive`,
      refundInitiate: (requestId: number | string) =>
        `/api/admin/returns/${requestId}/refund/initiate`,
      refundComplete: (requestId: number | string) =>
        `/api/admin/returns/${requestId}/refund/complete`,
    },
    exchanges: {
      base: '/api/admin/exchanges',
      approve: (requestId: number | string) =>
        `/api/admin/exchanges/${requestId}/approve`,
      reject: (requestId: number | string) =>
        `/api/admin/exchanges/${requestId}/reject`,
      pickup: (requestId: number | string) =>
        `/api/admin/exchanges/${requestId}/pickup`,
      receive: (requestId: number | string) =>
        `/api/admin/exchanges/${requestId}/receive`,
      replacementOrder: (requestId: number | string) =>
        `/api/admin/exchanges/${requestId}/replacement-order`,
      replacementDelivered: (requestId: number | string) =>
        `/api/admin/exchanges/${requestId}/replacement-delivered`,
    },
    transfers: {
      base: '/api/admin/transfers',
      approve: (transferId: number | string) =>
        `/api/admin/transfers/${transferId}/approve`,
      reject: (transferId: number | string) =>
        `/api/admin/transfers/${transferId}/reject`,
      plan: (transferId: number | string) =>
        `/api/admin/transfers/${transferId}/plan`,
      pickup: (transferId: number | string) =>
        `/api/admin/transfers/${transferId}/pickup`,
      receive: (transferId: number | string) =>
        `/api/admin/transfers/${transferId}/receive`,
    },
    updateSellerStatusAlias: (id: number | string, status: string) =>
      `/api/seller/${id}/status/${status}`,
  },

  coupons: {
    apply: '/api/coupons/apply',
    recommendation: '/api/coupons/recommendation',
    adminCreate: '/api/coupons/admin/create',
    adminUpdate: (id: number | string) => `/api/coupons/admin/${id}`,
    adminDisable: (id: number | string) => `/api/coupons/admin/${id}/disable`,
    adminMapUsers: (id: number | string) => `/api/coupons/admin/${id}/users`,
    adminDelete: (id: number | string) => `/api/coupons/admin/create/${id}`,
    adminAll: '/api/coupons/admin/all',
    adminMetrics: '/api/coupons/admin/metrics',
    adminMonitoring: '/api/coupons/admin/monitoring',
  },

  cart: {
    base: '/api/cart',
    add: '/api/cart/add',
    item: (cartItemId: number | string) => `/api/cart/item/${cartItemId}`,
    baseAlias: '/cart',
    addAlias: '/cart/add',
    itemAlias: (cartItemId: number | string) => `/cart/item/${cartItemId}`,
  },

  deals: {
    base: '/admin/deal',
    byId: (id: number | string) => `/admin/deal/${id}`,
    aliasBase: '/admin/dael',
    aliasById: (id: number | string) => `/admin/dael/${id}`,
  },

  homeCategory: {
    create: '/home/categories',
    adminList: '/admin/home-category',
    adminUpdate: (id: number | string) => `/admin/home-category/${id}`,
  },

  orders: {
    base: '/api/orders',
    create: '/api/orders/create',
    summary: '/api/orders/summary',
    userHistory: '/api/orders/user/history',
    byId: (orderId: number | string) => `/api/orders/${orderId}`,
    deliveryHistory: (orderId: number | string) =>
      `/api/orders/${orderId}/delivery-history`,
    itemById: (orderItemId: number | string) =>
      `/api/orders/item/${orderItemId}`,
    cancelReasons: '/api/orders/cancel-reasons',
    cancel: (orderId: number | string) => `/api/orders/${orderId}/cancel`,
    returnExchange: {
      base: '/api/orders/return-exchange',
      byId: (requestId: number | string) =>
        `/api/orders/return-exchange/${requestId}`,
      byItem: (orderItemId: number | string) =>
        `/api/orders/return-exchange/items/${orderItemId}`,
    },
    exchanges: {
      base: '/api/orders/exchanges',
      byId: (requestId: number | string) =>
        `/api/orders/exchanges/${requestId}`,
      byItem: (orderItemId: number | string) =>
        `/api/orders/exchanges/items/${orderItemId}`,
      differencePayment: (requestId: number | string) =>
        `/api/orders/exchanges/${requestId}/difference-payment`,
      balanceMode: (requestId: number | string) =>
        `/api/orders/exchanges/${requestId}/balance-mode`,
      bankDetails: (requestId: number | string) =>
        `/api/orders/exchanges/${requestId}/bank-details`,
    },
  },

  payment: {
    byId: (paymentId: number | string) => `/api/payment/${paymentId}`,
    statusByOrder: (paymentOrderId: number | string) =>
      `/api/payment/orders/${paymentOrderId}/status`,
    createOrder: '/api/payments/create-order',
    retry: (orderId: number | string) => `/api/payments/retry/${orderId}`,
    manualUpiList: '/api/payments/manual-upi-qr',
    manualUpiSubmit: '/api/payments/manual-upi-qr/submit',
    manualUpiVerify: (manualPaymentId: number | string) =>
      `/api/payments/manual-upi-qr/${manualPaymentId}/verify`,
  },

  products: {
    list: '/products',
    search: '/products/search',
    byId: (productId: number | string) => `/products/${productId}`,
    notifyMe: (productId: number | string) =>
      `/api/products/${productId}/notify-me`,
    notifyMeStatus: (productId: number | string) =>
      `/api/products/${productId}/notify-me/status`,
    listAlias: '/api/products',
    searchAlias: '/api/products/search',
    byIdAlias: (productId: number | string) => `/api/products/${productId}`,
  },

  reviews: {
    byProduct: (productId: number | string) =>
      `/api/product/${productId}/reviews`,
    byId: (reviewId: number | string) => `/api/reviews/${reviewId}`,
  },

  sellers: {
    login: '/sellers/login',
    verifyEmail: (otp: string) => `/sellers/verifyEmail/${otp}`,
    signup: '/sellers',
    profile: '/sellers/profile',
    requestEmailChangeOtp: '/sellers/email/change/request-otp',
    verifyEmailChangeOtp: '/sellers/email/change/verify',
    byId: (id: number | string) => `/sellers/${id}`,
    list: '/sellers',
    patch: '/sellers',
    delete: (id: number | string) => `/sellers/${id}`,
    updateStatus: (id: number | string) => `/sellers/${id}/status`,
    report: '/sellers/report',
    taxPreview: '/api/sellers/tax-rules/preview',
  },

  sellerProducts: {
    base: '/api/sellers/products',
    byId: (productId: number | string) => `/api/sellers/products/${productId}`,
    active: (productId: number | string) =>
      `/api/sellers/products/${productId}/active`,
    transferToWarehouse: (productId: number | string) =>
      `/api/sellers/products/${productId}/warehouse-transfer`,
    movements: (productId: number | string) =>
      `/api/sellers/products/${productId}/movements`,
    demand: '/api/sellers/products/demand',
  },

  sellerOrders: {
    base: '/api/seller/orders',
    updateStatus: (orderId: number | string, orderStatus: string) =>
      `/api/seller/orders/${orderId}/status/${orderStatus}`,
    deliveryHistory: (orderId: number | string) =>
      `/api/seller/orders/${orderId}/delivery-history`,
  },

  sellerAftercare: {
    returns: '/api/seller/aftercare/returns',
    exchanges: '/api/seller/aftercare/exchanges',
  },

  sellerComplianceNotes: {
    base: '/api/seller/compliance/notes',
    byId: (id: number | string) => `/api/seller/compliance/notes/${id}`,
    read: (id: number | string) => `/api/seller/compliance/notes/${id}/read`,
    unread: (id: number | string) =>
      `/api/seller/compliance/notes/${id}/unread`,
    acknowledge: (id: number | string) =>
      `/api/seller/compliance/notes/${id}/acknowledge`,
    unacknowledge: (id: number | string) =>
      `/api/seller/compliance/notes/${id}/unacknowledge`,
    unreadCount: '/api/seller/compliance/notes/unread-count',
    acknowledgedCount: '/api/seller/compliance/notes/acknowledged-count',
    attachmentDownload: (id: number | string, attachmentId: string) =>
      `/api/seller/compliance/notes/${id}/attachments/${attachmentId}/download`,
  },

  sellerTransfers: {
    base: '/api/seller/transfers',
    cancel: (transferId: number | string) =>
      `/api/seller/transfers/${transferId}/cancel`,
  },

  transactions: {
    seller: '/api/transactions/seller',
    list: '/api/transactions',
    sellerAlias: '/api/Transactions/seller',
    listAlias: '/api/Transactions',
  },

  settlements: {
    seller: '/api/settlements/seller',
    sellerLedger: '/api/settlements/seller/ledger',
    list: '/api/settlements',
    ledger: '/api/settlements/ledger',
  },

  wishlist: {
    base: '/api/wishlist',
    addProduct: (productId: number | string) =>
      `/api/wishlist/add-product/${productId}`,
    removeProduct: (productId: number | string) =>
      `/api/wishlist/product/${productId}`,
  },

  adminCouriers: {
    base: '/api/admin/couriers',
    byId: (courierId: number | string) => `/api/admin/couriers/${courierId}`,
    status: (courierId: number | string, status: string) =>
      `/api/admin/couriers/${courierId}/status?status=${status}`,
    salary: (courierId: number | string) =>
      `/api/admin/couriers/${courierId}/salary`,
    zone: (courierId: number | string) =>
      `/api/admin/couriers/${courierId}/zone`,
    assign: (courierId: number | string) =>
      `/api/admin/couriers/${courierId}/assign`,
    assignments: (courierId: number | string) =>
      `/api/admin/couriers/${courierId}/assignments`,
    earnings: (courierId: number | string, month: string) =>
      `/api/admin/couriers/${courierId}/earnings?month=${month}`,
    codFrequency: (courierId: number | string) =>
      `/api/admin/couriers/${courierId}/cod-frequency`,
    codSettlements: (query?: string) =>
      `/api/admin/couriers/cod-settlements${query ? `?${query}` : ''}`,
    updateCodSettlement: (settlementId: number | string) =>
      `/api/admin/couriers/cod-settlements/${settlementId}`,
    petrolClaims: (query?: string) =>
      `/api/admin/couriers/petrol-claims${query ? `?${query}` : ''}`,
    updatePetrolClaim: (claimId: number | string) =>
      `/api/admin/couriers/petrol-claims/${claimId}`,
    orders: (query?: string) =>
      `/api/admin/courier-orders${query ? `?${query}` : ''}`,
    dispatchQueue: (query?: string) =>
      `/api/admin/dispatch/queue${query ? `?${query}` : ''}`,
    batchAssign: '/api/admin/dispatch/assign',
    reassign: (shipmentId: number | string) =>
      `/api/admin/dispatch/shipments/${shipmentId}/reassign`,
    deliveryHistory: (orderId: number | string) =>
      `/api/admin/dispatch/orders/${orderId}/delivery-history`,
    payroll: (query?: string) =>
      `/api/admin/couriers/payroll${query ? `?${query}` : ''}`,
    payrollRun: '/api/admin/couriers/payroll/run',
    payrollLock: (courierId: number | string) =>
      `/api/admin/couriers/payroll/${courierId}/lock`,
    payout: '/api/admin/couriers/payouts',
  },

  courier: {
    profile: '/api/courier/profile',
    assignments: '/api/courier/assignments',
    assignmentById: (assignmentId: number | string) =>
      `/api/courier/assignments/${assignmentId}`,
    sendDeliveryOtp: (orderId: number | string) =>
      `/api/courier/assignments/${orderId}/delivery-otp/send`,
    deliveryStatus: (orderId: number | string) =>
      `/api/courier/deliveries/${orderId}/status`,
    codSettlements: '/api/courier/cod-settlements',
    codSummary: '/api/courier/cod-summary',
    petrolClaims: '/api/courier/petrol-claims',
    earnings: (month: string) => `/api/courier/earnings?month=${month}`,
    earningsHistory: '/api/courier/earnings/history',
    reversePickups: '/api/courier/reverse-pickups',
    reversePickupStatus: (taskId: number | string) =>
      `/api/courier/reverse-pickups/${taskId}/status`,
    exchangePickups: '/api/courier/exchange-pickups',
    exchangePickupStatus: (pickupId: number | string) =>
      `/api/courier/exchange-pickups/${pickupId}/status`,
  },
} as const;
