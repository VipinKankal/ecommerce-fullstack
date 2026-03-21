import React from 'react';
import { Alert, Divider, Radio } from '@mui/material';
import { teal } from '@mui/material/colors';
import { PaymentOption } from '../types/checkoutTypes';

interface PaymentOptionItem {
  id: PaymentOption;
  title: string;
  sub: string;
}

interface Props {
  paymentOptions: PaymentOptionItem[];
  paymentMethod: PaymentOption;
  onPaymentMethodChange: (value: PaymentOption) => void;
}

const PaymentMethodList = ({
  paymentOptions,
  paymentMethod,
  onPaymentMethodChange,
}: Props) => {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-12">
        <div className="divide-y border-r bg-gray-50 md:col-span-4">
          {paymentOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`w-full px-4 py-3 text-left text-sm font-semibold ${
                paymentMethod === opt.id
                  ? 'border-l-4 border-rose-500 bg-white text-rose-600'
                  : 'text-gray-700'
              }`}
              onClick={() => onPaymentMethodChange(opt.id)}
            >
              {opt.id === 'COD' ? 'Cash On Delivery' : 'UPI (Pay via PhonePe)'}
            </button>
          ))}
          <div className="px-4 py-3 text-sm text-gray-400">
            Credit/Debit Card
          </div>
          <div className="px-4 py-3 text-sm text-gray-400">Wallets</div>
          <div className="px-4 py-3 text-sm text-gray-400">Pay Later</div>
          <div className="px-4 py-3 text-sm text-gray-400">EMI</div>
          <div className="px-4 py-3 text-sm text-gray-400">Net Banking</div>
        </div>
        <div className="p-4 md:col-span-8">
          <div className="flex items-start gap-3">
            <Radio
              checked={paymentMethod === 'COD'}
              onChange={() => onPaymentMethodChange('COD')}
              sx={{ '&.Mui-checked': { color: teal[600] } }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Cash On Delivery (Cash/UPI)
              </p>
              <p className="text-xs text-gray-500">
                Pay when your order is delivered.
              </p>
            </div>
          </div>
          <Divider className="my-4" />
          <div className="flex items-start gap-3">
            <Radio
              checked={paymentMethod === 'PHONEPE'}
              onChange={() => onPaymentMethodChange('PHONEPE')}
              sx={{ '&.Mui-checked': { color: teal[600] } }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                UPI (PhonePe)
              </p>
              <p className="text-xs text-gray-500">
                If PhonePe session creates successfully, you will be redirected
                there to complete payment.
              </p>
            </div>
          </div>
          {paymentMethod === 'PHONEPE' && (
            <Alert className="mt-4" severity="info">
              PhonePe available hua to redirect hoga. Agar backend config
              missing hui to exact error neeche show hoga.
            </Alert>
          )}
          {paymentMethod === 'COD' && (
            <Alert className="mt-4" severity="info">
              COD order confirm hone ke baad shipping process start hoga.
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodList;
