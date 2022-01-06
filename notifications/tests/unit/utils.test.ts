import { PaymentStatus, Payment, RefundStatus, Refund } from '@mollie/api-client';
import { Amount } from '@mollie/api-client/dist/types/src/data/global';
import { CTMoney, CTTransaction, CTTransactionState, CTTransactionType } from '../../src/types/ctPaymentTypes';
import { UpdateActionKey } from '../../src/types/ctUpdateActions';
import {
  isOrderOrPayment,
  shouldPaymentStatusUpdate,
  shouldRefundStatusUpdate,
  getMatchingMolliePayment,
  getTransactionStateUpdateOrderActions,
  getPaymentStatusUpdateAction,
  convertMollieAmountToCTMoney,
  existsInCtTransactionsArray,
  getAddTransactionUpdateActions,
  getRefundStatusUpdateActions,
} from '../../src/utils';

describe('isOrderOrPayment', () => {
  it("should return order when the resource id starts with 'ord_'", () => {
    const result = isOrderOrPayment('ord_td5h6f');
    expect(result).toBe('order');
  });
  it("should return payment when the resource id starts with 'tr_'", () => {
    const result = isOrderOrPayment('tr_td5h6f');
    expect(result).toBe('payment');
  });
  it('should return error when the resource id does not match an expected pattern', () => {
    const result = isOrderOrPayment('invalid_string');
    expect(result).toBe('invalid');
  });
});

describe('shouldPaymentStatusUpdate', () => {
  it('should return correct object when valid parameters are provided', () => {
    expect(shouldPaymentStatusUpdate(PaymentStatus.paid, 'Failure')).toMatchObject({ shouldUpdate: true, newStatus: CTTransactionState.Success });
    expect(shouldPaymentStatusUpdate(PaymentStatus.canceled, 'Failure')).toMatchObject({ shouldUpdate: false, newStatus: CTTransactionState.Failure });
  });
  it('should return correct object when invalid parameters are provided', () => {
    expect(shouldPaymentStatusUpdate('skjdfhksjfdh', 'Failnvnvjsdnjsure')).toMatchObject({ shouldUpdate: false, newStatus: 'Initial' });
  });
});

describe('shouldRefundStatusUpdate', () => {
  it('should return boolean shouldUpdate based on the mollie and ct transaction states', () => {
    const cases = [
      // should update
      { mollieStatus: RefundStatus.queued, ctStatus: CTTransactionState.Initial, expectedResult: true },
      { mollieStatus: RefundStatus.pending, ctStatus: CTTransactionState.Initial, expectedResult: true },
      { mollieStatus: RefundStatus.processing, ctStatus: CTTransactionState.Initial, expectedResult: true },
      { mollieStatus: RefundStatus.refunded, ctStatus: CTTransactionState.Initial, expectedResult: true },
      { mollieStatus: RefundStatus.failed, ctStatus: CTTransactionState.Initial, expectedResult: true },
      // should not update
      { mollieStatus: RefundStatus.queued, ctStatus: CTTransactionState.Pending, expectedResult: false },
      { mollieStatus: RefundStatus.pending, ctStatus: CTTransactionState.Pending, expectedResult: false },
      { mollieStatus: RefundStatus.processing, ctStatus: CTTransactionState.Pending, expectedResult: false },
      { mollieStatus: RefundStatus.refunded, ctStatus: CTTransactionState.Success, expectedResult: false },
      { mollieStatus: RefundStatus.failed, ctStatus: CTTransactionState.Failure, expectedResult: false },
    ];

    cases.forEach(({ mollieStatus, ctStatus, expectedResult }) => {
      expect(shouldRefundStatusUpdate(mollieStatus, ctStatus)).toBe(expectedResult);
    });
  });

  it('should handle incorrect input by returning shouldUpdate: false', () => {
    expect(shouldRefundStatusUpdate('' as RefundStatus, '' as CTTransactionState)).toBeFalsy();
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

describe('convertMollieToCTPaymentAmount', () => {
  it('should return correct centAmount from mollie payment amount', () => {
    const testCases = [
      { mollieAmount: '10.00', expectedCentAmount: 1000 },
      { mollieAmount: '-15.00', expectedCentAmount: -1500 },
      { mollieAmount: '0.50', expectedCentAmount: 50 },
      { mollieAmount: '-19.99', expectedCentAmount: -1999 },
      { mollieAmount: '0.01', expectedCentAmount: 1 },
    ];
    testCases.forEach(({ mollieAmount, expectedCentAmount }) => {
      const expectedResult = {
        currencyCode: 'EUR',
        centAmount: expectedCentAmount,
        fractionDigits: 2,
        type: 'centPrecision',
      };
      expect(convertMollieAmountToCTMoney({ value: mollieAmount, currency: 'EUR' } as Amount)).toStrictEqual(expectedResult);
      const expectedResult2 = { currencyCode: 'USD', centAmount: -9, fractionDigits: 1, type: 'centPrecision' };
      expect(convertMollieAmountToCTMoney({ value: '-0.9', currency: 'USD' } as Amount)).toStrictEqual(expectedResult2);
      const expectedResult3 = { currencyCode: 'USD', centAmount: -995, fractionDigits: 6, type: 'centPrecision' };
      expect(convertMollieAmountToCTMoney({ value: '-0.000995', currency: 'USD' } as Amount)).toStrictEqual(expectedResult3);
    });
  });
  it('should return correct centAmount with currency without digits', () => {
    const expectedResult = { currencyCode: 'ISK', centAmount: 1050, fractionDigits: 0, type: 'centPrecision' };
    expect(convertMollieAmountToCTMoney({ value: '1050', currency: 'ISK' } as Amount)).toStrictEqual(expectedResult);
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

describe('Check if mollie payment exists in ctTransactions array', () => {
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
