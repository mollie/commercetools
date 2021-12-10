import { makeActions } from '../src/makeActions';
import { CTTransactionState } from '../src/types/ctPaymentTypes';

describe('makeActions', () => {
  it('changeTransactionState - should return update action with new state', () => {
    const mockTransactionId = '04e225cf-7de7-4fd7-a9e7-258ec9e32d3e';
    const updateAction = makeActions.changeTransactionState(mockTransactionId, CTTransactionState.Success);
    expect(updateAction).toEqual({
      action: 'changeTransactionState',
      transactionId: mockTransactionId,
      state: CTTransactionState.Success,
    });
  });

  it('setStatusInterfaceText - should return update action with a mollie order status text', () => {
    const updateAction = makeActions.setStatusInterfaceText('paid');
    expect(updateAction).toEqual({
      action: 'setMethodInfoName',
      interfaceText: 'paid',
    });
  });
});
