import { api } from 'shared/api/Api';
import { AppDispatch } from 'app/store/Store';
import { createOrderDetailsHandlers } from './orderDetailsHandlers';
import { OrderItemLite } from './orderDetailsTypes';

const createStateSetters = () => ({
  setReturnRefundRequests: jest.fn(),
  setReturnRefundLoading: jest.fn(),
  setReturnRefundSubmitting: jest.fn(),
  setReturnRefundError: jest.fn(),
  setReturnRefundOpen: jest.fn(),
  setCancelSuccess: jest.fn(),
  setCancelDialogOpen: jest.fn(),
  setExchangeFormOpen: jest.fn(),
  setDifferenceDialogOpen: jest.fn(),
  setPaymentReference: jest.fn(),
  setBalanceFormOpen: jest.fn(),
  setBankFormOpen: jest.fn(),
});

describe('orderDetailsHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads return/refund requests and normalizes array data', async () => {
    const getSpy = jest.spyOn(api, 'get').mockResolvedValue({
      data: [{ id: 1, orderItemId: 11 }],
    } as { data: Array<{ id: number; orderItemId: number }> });
    const setters = createStateSetters();
    const dispatchMock = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({}),
    }));

    const handlers = createOrderDetailsHandlers({
      dispatch: dispatchMock as unknown as AppDispatch,
      item: { id: 11 } as OrderItemLite,
      resolvedOrderId: '101',
      selectedCancelReason: 'OTHER',
      cancelReasonText: 'test',
      latestExchangeRequest: { id: 500 },
      paymentReference: 'PAY-1',
      ...setters,
    });

    await handlers.loadReturnRefundRequests();

    expect(getSpy).toHaveBeenCalledWith('/api/orders/returns');
    expect(setters.setReturnRefundRequests).toHaveBeenCalledWith([
      { id: 1, orderItemId: 11 },
    ]);
    expect(setters.setReturnRefundLoading).toHaveBeenCalledWith(true);
    expect(setters.setReturnRefundLoading).toHaveBeenLastCalledWith(false);
  });

  test('does not dispatch cancel when reason is missing', async () => {
    const setters = createStateSetters();
    const dispatchMock = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({}),
    }));
    const handlers = createOrderDetailsHandlers({
      dispatch: dispatchMock as unknown as AppDispatch,
      item: { id: 11 } as OrderItemLite,
      resolvedOrderId: '101',
      selectedCancelReason: '',
      cancelReasonText: '',
      latestExchangeRequest: { id: 500 },
      paymentReference: 'PAY-1',
      ...setters,
    });

    await handlers.handleCancelOrder();

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  test('submits difference payment and resets dialog state', async () => {
    const setters = createStateSetters();
    const dispatchMock = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({}),
    }));
    const handlers = createOrderDetailsHandlers({
      dispatch: dispatchMock as unknown as AppDispatch,
      item: { id: 11 } as OrderItemLite,
      resolvedOrderId: '101',
      selectedCancelReason: 'OTHER',
      cancelReasonText: 'test',
      latestExchangeRequest: { id: 500 },
      paymentReference: 'REF-123',
      ...setters,
    });

    await handlers.handleDifferencePayment();

    expect(dispatchMock).toHaveBeenCalled();
    expect(setters.setDifferenceDialogOpen).toHaveBeenCalledWith(false);
    expect(setters.setPaymentReference).toHaveBeenCalledWith('');
  });
});
