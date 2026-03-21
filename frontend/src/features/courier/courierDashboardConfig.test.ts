import { mergeAssignmentsWithReverseTasks } from './courierDashboardConfig';
import { CourierAssignmentItem } from './courierTypes';

const baseAssignment = (): CourierAssignmentItem => ({
  id: 1,
  orderId: 101,
  customerName: 'Test User',
  address: 'Test Address',
  paymentType: 'PAID',
  paymentStatus: 'PAID',
  amount: 100,
  courierTaskStatus: 'ASSIGNED',
  shipmentStatus: 'LABEL_CREATED',
  requiresOtp: false,
  taskFlow: 'RETURN',
  returnId: 200,
});

describe('mergeAssignmentsWithReverseTasks', () => {
  test('merges reverse task details into existing return assignment', () => {
    const merged = mergeAssignmentsWithReverseTasks(
      [baseAssignment()],
      [
        {
          id: 500,
          requestId: 200,
          requestType: 'RETURN',
          status: 'ACCEPTED',
          pickupAddress: 'Merged Address',
          customerName: 'Merged User',
          amount: 123,
        },
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].reverseTaskId).toBe(500);
    expect(merged[0].reversePickupTaskStatus).toBe('ACCEPTED');
    expect(merged[0].returnId).toBe(200);
    expect(merged[0].taskFlow).toBe('RETURN');
  });

  test('creates synthetic return assignment when no existing return task is present', () => {
    const merged = mergeAssignmentsWithReverseTasks(
      [],
      [
        {
          id: 900,
          requestId: 901,
          orderId: 902,
          requestType: 'EXCHANGE',
          status: 'PICKUP_SCHEDULED',
          customerName: 'Synthetic User',
          pickupAddress: 'Synthetic Address',
          amount: 456,
        },
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].taskFlow).toBe('RETURN');
    expect(merged[0].reverseType).toBe('EXCHANGE');
    expect(merged[0].reverseTaskId).toBe(900);
    expect(merged[0].returnId).toBe(901);
    expect(merged[0].paymentType).toBe('PAID');
  });
});
