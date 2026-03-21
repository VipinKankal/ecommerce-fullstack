import { api } from 'shared/api/Api';
import { createDeliveryHandlers } from './courierDashboardDeliveryHandlers';
import { CourierAssignmentItem } from '../courierTypes';
import {
  CourierCodFormState,
  CourierDeliveryFormState,
  CourierPetrolFormState,
} from './courierDashboardTypes';

const createSetters = () => ({
  setError: jest.fn(),
  setSuccessMessage: jest.fn(),
  setVerifyingOtp: jest.fn(),
  setToast: jest.fn(),
  setSelectedTask: jest.fn(),
  setOtpSent: jest.fn(),
  setDeliveryAction: jest.fn(),
  setDeliveryForm: jest.fn(),
  setOtpCooldownUntil: jest.fn(),
  setUploadingProof: jest.fn(),
  setUploadingReceipt: jest.fn(),
  setCodForm: jest.fn(),
  setPetrolForm: jest.fn(),
});

const baseTask = {
  id: 1,
  orderId: 101,
  customerName: 'Test',
  address: 'Address',
  paymentType: 'PAID',
  paymentStatus: 'PAID',
  amount: 100,
  courierTaskStatus: 'ARRIVED',
  shipmentStatus: 'OUT_FOR_DELIVERY',
  requiresOtp: true,
};

describe('createDeliveryHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks delivered submit when OTP is missing', async () => {
    const patchSpy = jest.spyOn(api, 'patch').mockResolvedValue({});
    const setters = createSetters();

    const handlers = createDeliveryHandlers({
      selectedTask: baseTask as unknown as CourierAssignmentItem,
      deliveryAction: 'DELIVERED',
      deliveryForm: {
        codAmount: '',
        codMode: 'CASH',
        otp: '',
        proofPhotoUrl: '',
        transactionId: '',
        failureReason: '',
        statusReason: '',
        statusNote: '',
      } as CourierDeliveryFormState,
      codForm: {
        amount: '',
        mode: 'CASH',
        referenceId: '',
        settlementDate: '',
      } as CourierCodFormState,
      petrolForm: {
        claimMonth: '2026-03',
        amount: '',
        receiptUrl: '',
        notes: '',
      } as CourierPetrolFormState,
      otpDigits: '',
      isArrivedOrBeyond: true,
      ...setters,
      loadWorkspace: jest.fn().mockResolvedValue(undefined),
    });

    await handlers.handleDeliverySubmit('DELIVERED');

    expect(setters.setError).toHaveBeenLastCalledWith(
      'Enter customer OTP after sending it to complete delivery',
    );
    expect(patchSpy).not.toHaveBeenCalled();
  });

  test('blocks sending OTP before arrived state', async () => {
    const patchSpy = jest.spyOn(api, 'patch').mockResolvedValue({});
    const setters = createSetters();

    const handlers = createDeliveryHandlers({
      selectedTask: baseTask as unknown as CourierAssignmentItem,
      deliveryAction: 'DELIVERED',
      deliveryForm: {
        codAmount: '',
        codMode: 'CASH',
        otp: '',
        proofPhotoUrl: '',
        transactionId: '',
        failureReason: '',
        statusReason: '',
        statusNote: '',
      } as CourierDeliveryFormState,
      codForm: {
        amount: '',
        mode: 'CASH',
        referenceId: '',
        settlementDate: '',
      } as CourierCodFormState,
      petrolForm: {
        claimMonth: '2026-03',
        amount: '',
        receiptUrl: '',
        notes: '',
      } as CourierPetrolFormState,
      otpDigits: '',
      isArrivedOrBeyond: false,
      ...setters,
      loadWorkspace: jest.fn().mockResolvedValue(undefined),
    });

    await handlers.handleSendDeliveryOtp();

    expect(setters.setError).toHaveBeenLastCalledWith(
      'Mark the order as Arrived before sending OTP.',
    );
    expect(patchSpy).not.toHaveBeenCalled();
  });
});
