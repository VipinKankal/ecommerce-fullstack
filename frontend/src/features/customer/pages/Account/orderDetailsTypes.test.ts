import {
  cancelAllowed,
  prettyLabel,
  resolveCustomerStatus,
} from './orderDetailsTypes';

describe('orderDetailsTypes', () => {
  test('resolveCustomerStatus handles critical delivery states', () => {
    expect(resolveCustomerStatus({ id: 1, orderStatus: 'CANCELLED' })).toBe(
      'CANCELLED',
    );

    expect(
      resolveCustomerStatus({
        id: 2,
        orderStatus: 'PLACED',
        shipmentStatus: 'DELIVERED',
      }),
    ).toBe('DELIVERED');

    expect(
      resolveCustomerStatus({
        id: 3,
        orderStatus: 'PLACED',
        deliveryTaskStatus: 'CONFIRMATION_PENDING',
      }),
    ).toBe('CONFIRMATION_PENDING');

    expect(
      resolveCustomerStatus({
        id: 4,
        orderStatus: 'PLACED',
        deliveryTaskStatus: 'ARRIVED',
      }),
    ).toBe('ARRIVED_AT_LOCATION');

    expect(
      resolveCustomerStatus({
        id: 5,
        orderStatus: 'PLACED',
        shipmentStatus: 'OUT_FOR_DELIVERY',
      }),
    ).toBe('OUT_FOR_DELIVERY');

    expect(
      resolveCustomerStatus({
        id: 6,
        orderStatus: 'PLACED',
        shipmentStatus: 'IN_TRANSIT',
      }),
    ).toBe('SHIPPED');

    expect(
      resolveCustomerStatus({
        id: 7,
        orderStatus: 'PLACED',
        fulfillmentStatus: 'FULFILLED',
      }),
    ).toBe('PACKED');
  });

  test('prettyLabel and cancelAllowed stay stable', () => {
    expect(prettyLabel('OUT_FOR_DELIVERY')).toBe('OUT FOR DELIVERY');
    expect(prettyLabel(undefined)).toBe('');

    expect(cancelAllowed.has('PENDING')).toBe(true);
    expect(cancelAllowed.has('DELIVERED')).toBe(false);
  });
});
