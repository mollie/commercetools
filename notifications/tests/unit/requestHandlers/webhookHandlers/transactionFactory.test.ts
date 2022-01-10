import { Payment, Refund, RefundStatus } from '@mollie/api-client';
import { CTMoney, CTTransaction, CTTransactionState, CTTransactionType } from '../../../../src/types/ctPayment';
import {
  existsInCtTransactionsArray,
  getAddTransactionUpdateActions,
  getMatchingMolliePayment,
  getPaymentStatusUpdateAction,
  getRefundStatusUpdateActions,
  getTransactionStateUpdateOrderActions,
} from '../../../../src/requestHandlers/webhookHandlers/transactionFactory';
import { UpdateActionKey } from '../../../../src/types/ctUpdateActions';

describe('existsInCtTransactionsArray', () => {
  const mockMolliePayment = {
    id: 'tr_12345',
    status: 'paid',
    amount: {
      currency: 'EUR',
      value: '10.00',
    },
  } as Payment;
  const missingMockMolliePayment = {
    id: 'tr_00000',
    status: 'paid',
    createdAt: '2021-10-20T15:10:45.000Z',
    amount: {
      currency: 'EUR',
      value: '10.00',
    },
  } as Payment;

  const mockMolliePaymentsArray = [mockMolliePayment, missingMockMolliePayment];
  const mockedCTTransactionsArray = [
    {
      id: '5603cab8-ed6f-4d8e-a339-c4efc45ba971',
      interactionId: 'tr_12345',
      state: CTTransactionState.Initial,
      amount: {
        centAmount: 1000,
        currencyCode: 'EUR',
        fractionDigits: 2,
        type: 'centPrecision',
      },
      type: CTTransactionType.Charge,
    } as CTTransaction,
    {
      id: '95a74202-48b5-4a5e-ae92-50820f479f4c',
      interactionId: 'tr_45609',
      state: CTTransactionState.Failure,
      amount: {
        centAmount: 1000,
        currencyCode: 'EUR',
        fractionDigits: 2,
        type: 'centPrecision',
      },
      type: CTTransactionType.Charge,
    } as CTTransaction,
  ];
  it("Should find the mollie payment in the CT array when it's present", () => {
    expect(existsInCtTransactionsArray(mockMolliePayment, mockedCTTransactionsArray)).toBeTruthy();
  });
  it("Should confirm the mollie payment isn't present in the CT array", () => {
    expect(existsInCtTransactionsArray(missingMockMolliePayment, mockedCTTransactionsArray)).toBeFalsy();
  });
  it("Should return single update action if one of the mollie payments isn't present in the CT array", () => {
    expect(getAddTransactionUpdateActions(mockedCTTransactionsArray, mockMolliePaymentsArray)).toMatchObject([
      {
        action: UpdateActionKey.AddTransaction,
        transaction: {
          type: CTTransactionType.Charge,
          amount: {
            centAmount: 1000,
            currencyCode: 'EUR',
          },
          timestamp: '2021-10-20T15:10:45.000Z',
          interactionId: 'tr_00000',
          state: CTTransactionState.Success,
        },
      },
    ]);
  });
});

describe('getMatchingMolliePayment', () => {
  const mockedMolliePaymentsArray = [
    {
      resource: 'payment',
      id: 'tr_6M49TmvAEv',
      mode: 'test',
    },
    {
      resource: 'payment',
      id: 'tr_8A10GhvXAp',
      mode: 'test',
    },
  ];
  it('Should return the correct mollie payment object', () => {
    expect(getMatchingMolliePayment(mockedMolliePaymentsArray, 'tr_6M49TmvAEv')).toMatchObject({
      resource: 'payment',
      id: 'tr_6M49TmvAEv',
      mode: 'test',
    });
  });
  it('Should return an empty object if the transactionId does not match a payment id in mollie payments array', () => {
    expect(getMatchingMolliePayment(mockedMolliePaymentsArray, 'tr_askjdnkjnv')).toMatchObject({});
  });
});

describe('getTransactionStateUpdateOrderActions', () => {
  const mockedMolliePaymentsArray = [
    {
      resource: 'payment',
      id: 'tr_6M49TmvAEv',
      mode: 'test',
      status: 'paid',
    },
    {
      resource: 'payment',
      id: 'tr_8A10GhvXAp',
      mode: 'test',
      status: 'paid',
    },
  ];
  const mockedCTTransactionsArray = [
    {
      id: '01ab9f97-45a3-4d64-92ae-d60e50533af3',
      timestamp: '2021-10-20T15:10:45.000Z',
      type: CTTransactionType.Charge,
      amount: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 1000,
        fractionDigits: 2,
      } as CTMoney,
      interactionId: 'tr_6M49TmvAEv',
      state: 'Initial',
    },
    {
      id: 'a0d49f90-e0a4-411d-84e4-60d26273f8fe',
      amount: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 1000,
        fractionDigits: 2,
      } as CTMoney,
      interactionId: 'tr_8A10GhvXAp',
      state: 'Success',
    },
  ] as CTTransaction[];
  const mockedUpdateActionsResults = [
    {
      action: UpdateActionKey.ChangeTransactionState,
      transactionId: '01ab9f97-45a3-4d64-92ae-d60e50533af3',
      state: 'Success',
    },
  ];
  it('Should return a single transaction state update order action', () => {
    expect(getTransactionStateUpdateOrderActions(mockedCTTransactionsArray, mockedMolliePaymentsArray)).toMatchObject(mockedUpdateActionsResults);
  });
  it('Should return an empty array when no update actions are required', () => {
    const mockedUpdatedCTTransactionsArray = [
      {
        id: '01ab9f97-45a3-4d64-92ae-d60e50533af3',
        timestamp: '2021-10-20T15:10:45.000Z',
        type: CTTransactionType.Charge,
        amount: {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 1000,
          fractionDigits: 2,
        } as CTMoney,
        interactionId: 'tr_6M49TmvAEv',
        state: 'Success',
      },
      {
        id: 'a0d49f90-e0a4-411d-84e4-60d26273f8fe',
        amount: {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 1000,
          fractionDigits: 2,
        } as CTMoney,
        interactionId: 'tr_8A10GhvXAp',
        state: 'Success',
      },
    ] as CTTransaction[];
    expect(getTransactionStateUpdateOrderActions(mockedUpdatedCTTransactionsArray, mockedMolliePaymentsArray)).toEqual([]);
  });
});

describe('getPaymentStatusUpdateAction', () => {
  const mockMolliePayment = {
    id: 'tr_12345',
    status: 'paid',
    amount: {
      currency: 'EUR',
      value: '10.00',
    },
  } as Payment;

  const mockMolliePayment2 = {
    id: 'tr_00000',
    status: 'paid',
    amount: {
      currency: 'EUR',
      value: '10.00',
    },
  } as Payment;

  const mockCTTransactions = [
    {
      id: '5603cab8-ed6f-4d8e-a339-c4efc45ba971',
      interactionId: 'tr_12345',
      state: CTTransactionState.Initial,
      amount: {
        centAmount: 1000,
        currencyCode: 'EUR',
      },
      type: CTTransactionType.Charge,
    },
    {
      id: '95a74202-48b5-4a5e-ae92-50820f479f4c',
      interactionId: 'tr_45609',
      state: CTTransactionState.Failure,
      amount: {
        centAmount: 1000,
        currencyCode: 'EUR',
      },
      type: CTTransactionType.Charge,
    },
  ];

  const mockAlreadyUpdatedCTTransactions = [
    {
      id: '5603cab8-ed6f-4d8e-a339-c4efc45ba971',
      interactionId: 'tr_12345',
      state: CTTransactionState.Success,
      amount: {
        centAmount: 1000,
        currencyCode: 'EUR',
      },
      type: CTTransactionType.Charge,
    },
  ];
  it('should return an update action if the payment status on mollie has changed', () => {
    const updateAction = getPaymentStatusUpdateAction(mockCTTransactions, mockMolliePayment);
    expect(updateAction).toEqual({
      action: 'changeTransactionState',
      transactionId: '5603cab8-ed6f-4d8e-a339-c4efc45ba971',
      state: 'Success',
    });
  });

  it('should return addTransaction action if there is no corresponding CT Transaction for the mollie payment', () => {
    const updateAction = getPaymentStatusUpdateAction(mockCTTransactions, mockMolliePayment2);
    expect(updateAction).toEqual({
      action: 'addTransaction',
      transaction: {
        amount: {
          currencyCode: 'EUR',
          centAmount: 1000,
          fractionDigits: 2,
          type: 'centPrecision',
        },
        interactionId: 'tr_00000',
        state: 'Success',
        type: CTTransactionType.Charge,
      },
    });
  });

  it('should return void if there is no changed needed as Transaction & payment status are equivalent', () => {
    const updateAction = getPaymentStatusUpdateAction(mockAlreadyUpdatedCTTransactions, mockMolliePayment);
    expect(updateAction).toBe(undefined);
  });
});

describe('getRefundStatusUpdateActions', () => {
  const mockMollieRefunds = [
    {
      id: 're_J7sR3kwTDs',
      paymentId: '',
      amount: {
        value: '20.00',
        currency: 'EUR',
      },
      status: RefundStatus.refunded,
    },
  ] as Refund[];

  it('should return an update transaction state action when the mollie refund exists as a CT Transaction, and the status has changed', () => {
    const updateActions = getRefundStatusUpdateActions(
      [
        {
          id: '9800287b-5479-41c7-ac18-d34def74a2f0',
          type: CTTransactionType.Charge,
          amount: {
            currencyCode: 'EUR',
            centAmount: 2000,
          },
          interactionId: 'tr_w2bpfFCfVT',
          state: CTTransactionState.Success,
        },
        {
          id: 'f39e9ddc-3fcc-4e09-b50b-b3d1c8068331',
          type: CTTransactionType.Refund,
          amount: {
            currencyCode: 'EUR',
            centAmount: 2000,
          },
          interactionId: 're_J7sR3kwTDs',
          state: CTTransactionState.Initial,
        },
      ],
      mockMollieRefunds,
    );
    expect(updateActions).toHaveLength(1);
    expect(updateActions[0]).toEqual({
      action: UpdateActionKey.ChangeTransactionState,
      transactionId: 'f39e9ddc-3fcc-4e09-b50b-b3d1c8068331',
      state: CTTransactionState.Success,
    });
  });

  it('should return an add transaction action when the mollie refund exists but the corresponding CT Transaction does not', () => {
    const updateActions = getRefundStatusUpdateActions([], mockMollieRefunds);
    expect(updateActions).toHaveLength(1);
    expect(updateActions[0]).toEqual({
      action: UpdateActionKey.AddTransaction,
      transaction: {
        type: CTTransactionType.Refund,
        amount: {
          currencyCode: 'EUR',
          centAmount: 2000,
          fractionDigits: 2,
          type: 'centPrecision',
        },
        interactionId: 're_J7sR3kwTDs',
        state: CTTransactionState.Success,
      },
    });
  });

  it('should not return an update transaction state action when the mollie refund status and CT Transaction state are already inline', () => {
    const updateActions = getRefundStatusUpdateActions(
      [
        {
          id: 'f39e9ddc-3fcc-4e09-b50b-b3d1c8068331',
          type: CTTransactionType.Refund,
          amount: {
            currencyCode: 'EUR',
            centAmount: 2000,
            fractionDigits: 2,
            type: 'centPrecision',
          },
          interactionId: 're_J7sR3kwTDs',
          state: CTTransactionState.Success,
        },
      ],
      mockMollieRefunds,
    );

    expect(updateActions).toHaveLength(0);
  });
});
