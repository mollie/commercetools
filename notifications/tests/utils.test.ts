import { PaymentStatus, Payment } from '@mollie/api-client';
import { CTMoney, CTTransaction, CTTransactionState } from '../src/types/ctPaymentTypes';
import { UpdateActionKey } from '../src/types/ctUpdateActions';
import { isOrderOrPayment, shouldPaymentStatusUpdate, getMatchingMolliePayment, getTransactionStateUpdateOrderActions, getPaymentStatusUpdateAction } from '../src/utils';

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
      type: 'Charge',
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
        type: 'Charge',
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
  } as Payment;

  const mockMollieUnknownPayment = {
    id: 'tr_00000',
    status: 'paid',
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
    },
    {
      id: '95a74202-48b5-4a5e-ae92-50820f479f4c',
      interactionId: 'tr_45609',
      state: CTTransactionState.Failure,
      amount: {
        centAmount: 1000,
        currencyCode: 'EUR',
      },
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

  it('should return void if there is no corresponding CT Transaction for the mollie payment', () => {
    const updateAction = getPaymentStatusUpdateAction(mockCTTransactions, mockMollieUnknownPayment);
    expect(updateAction).toBe(undefined);
  });

  it('should return void if there is no changed needed as Transaction & payment status are equivalent', () => {
    const updateAction = getPaymentStatusUpdateAction(mockAlreadyUpdatedCTTransactions, mockMolliePayment);
    expect(updateAction).toBe(undefined);
  });
});
