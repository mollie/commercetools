import { makeActions } from '../../src/makeActions';
import { CTTransactionState, CTTransactionType } from '../../src/types/ctPayment';

describe('makeActions', () => {
  it('addTransaction - should return update action with new transaction to be added', () => {
    const mockMollieAmount = {
      currency: 'EUR',
      value: '10.00',
    };
    const timestamp = '2021-08-02T09:29:56+00:00';
    const updateAction = makeActions.addTransaction(CTTransactionType.Authorization, mockMollieAmount, '546ad86a-f97a-4b82-938a-09368bb50217', CTTransactionState.Failure, timestamp);
    expect(updateAction).toEqual({
      action: 'addTransaction',
      transaction: {
        type: 'Authorization',
        amount: {
          currencyCode: 'EUR',
          centAmount: 1000,
          fractionDigits: 2,
          type: 'centPrecision',
        },
        interactionId: '546ad86a-f97a-4b82-938a-09368bb50217',
        state: 'Failure',
        timestamp,
      },
    });
  });

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
      action: 'setStatusInterfaceText',
      interfaceText: 'paid',
    });
  });
});
