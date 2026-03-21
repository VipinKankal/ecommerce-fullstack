import * as masterApiThunks from 'State/backend/MasterApiThunks';

describe('refactor checkpoints', () => {
  test('legacy masterApi thunk import path still exports core thunks', () => {
    expect(typeof masterApiThunks.homePing).toBe('function');
    expect(typeof masterApiThunks.productsList).toBe('function');
    expect(typeof masterApiThunks.orderById).toBe('function');
    expect(typeof masterApiThunks.sellerProductsList).toBe('function');
  });
});
