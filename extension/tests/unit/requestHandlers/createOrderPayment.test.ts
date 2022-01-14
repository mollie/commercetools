import { Payment } from '@mollie/api-client';
import { v4 as uuid } from 'uuid';
import { mocked } from 'ts-jest/utils';
import createOrderPayment, { getOrdersPaymentsParams, createCtActions } from '../../../src/requestHandlers/createOrderPayment';
import { Action, CTPayment } from '../../../src/types';
import { makeActions } from '../../../src/makeActions';
import Logger from '../../../src/logger/logger';

jest.mock('../../../src/makeActions');
jest.mock('uuid');

describe('getOrdersPaymentsParams', () => {
  it('Should create required params for mollie createOrderPayment call', async () => {
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      paymentMethodInfo: {
        paymentInterface: 'Mollie',
        method: 'ideal',
      },
    } as CTPayment;
    const expectedCreateOrderPaymentParams = {
      orderId: 'ord_3uwvfd',
      method: 'ideal',
    };
    expect(getOrdersPaymentsParams(mockCtPayment)).toEqual(expectedCreateOrderPaymentParams);
  });
});

describe('createCtActions', () => {
  it('Should create correct ct actions from request and mollies payment response', async () => {
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      paymentMethodInfo: {
        paymentInterface: 'Mollie',
        method: 'ideal',
      },
      transactions: [
        {
          id: 'b8243016-fc80-4af8-a273-47801f72ac31',
          timestamp: '2022-01-10T07:14:27.000Z',
          type: 'Charge',
          amount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 1104,
            fractionDigits: 2,
          },
          interactionId: 'tr_HfGsMew6vQ',
          state: 'Initial',
        },
      ],
    } as CTPayment;
    const mockOrderPaymentRes = {
      resource: 'payment',
      id: 'tr_mAmMrPGnxe',
      createdAt: '2021-10-20T15:35:13+00:00',
      amount: { value: '4.20', currency: 'EUR' },
      description: 'Order 1001',
      method: null,
      status: 'open',
      profileId: 'pfl_VtWA783A63',
      orderId: 'ord_3uwvfd',
    } as any as Payment;
    const ctActions = await createCtActions(mockOrderPaymentRes, mockCtPayment);
    expect(ctActions).toHaveLength(3);
    expect(makeActions.addInterfaceInteraction).toHaveBeenCalledTimes(1);
    expect(makeActions.changeTransactionInteractionId).toHaveBeenCalledTimes(1);
    expect(makeActions.changeTransactionInteractionId).toHaveBeenCalledWith(mockCtPayment.transactions![0].id, mockOrderPaymentRes.id);
    expect(makeActions.changeTransactionTimestamp).toHaveBeenCalledTimes(1);
    expect(makeActions.changeTransactionTimestamp).toHaveBeenCalledWith(mockCtPayment.transactions![0]?.id, mockOrderPaymentRes.createdAt);
  });
  it('Should return an error if no initial transaction is found', async () => {
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      paymentMethodInfo: {
        paymentInterface: 'Mollie',
        method: 'ideal',
      },
      transactions: [
        {
          id: 'b8243016-fc80-4af8-a273-47801f72ac31',
          timestamp: '2022-01-10T07:14:27.000Z',
          type: 'Charge',
          amount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 1104,
            fractionDigits: 2,
          },
          interactionId: 'tr_HfGsMew6vQ',
          state: 'Pending',
        },
      ],
    } as CTPayment;
    const expectedError = { status: 400, title: 'Cannot find original transaction', field: 'Payment.transactions' };
    await expect(createCtActions({} as any as Payment, mockCtPayment)).rejects.toMatchObject(expectedError);
  });
  it('Should return an error when generating actions fails', async () => {
    mocked(uuid).mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      paymentMethodInfo: {
        paymentInterface: 'Mollie',
        method: 'ideal',
      },
      transactions: [
        {
          id: 'b8243016-fc80-4af8-a273-47801f72ac31',
          timestamp: '2022-01-10T07:14:27.000Z',
          type: 'Charge',
          amount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 1104,
            fractionDigits: 2,
          },
          interactionId: 'tr_HfGsMew6vQ',
          state: 'Initial',
        },
      ],
    } as CTPayment;
    await expect(createCtActions({} as any as Payment, mockCtPayment)).rejects.toEqual(Error('Test error'));
  });
});
describe('createOrderPayment', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should prepare params, call mollie, handle response and return actions', async () => {
    const mockOrdersPaymentsParams = { orderId: 'ord_3uwvfd', method: 'ideal' };
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      paymentMethodInfo: {
        paymentInterface: 'Mollie',
        method: 'ideal',
      },
    } as CTPayment;
    const mockOrderPaymentResponse: any = {
      resource: 'payment',
      id: 'tr_mAmMrPGnxe',
      createdAt: '2021-10-20T15:35:13+00:00',
      amount: { value: '4.20', currency: 'EUR' },
      description: 'Test Order',
      method: null,
      status: 'open',
      orderId: 'ord_3uwvfd',
    };
    const mockCtActions: Action[] = [];
    const getOrdersPaymentsParams = jest.fn().mockReturnValueOnce(mockOrdersPaymentsParams);
    const createCtActions = jest.fn().mockResolvedValueOnce(mockCtActions);
    const mollieClient = { orders_payments: { create: jest.fn().mockResolvedValueOnce(mockOrderPaymentResponse) } } as any;

    const createOrderPaymentRes = await createOrderPayment(mockCtPayment, mollieClient, getOrdersPaymentsParams, createCtActions);
    expect(getOrdersPaymentsParams).toBeCalledWith(mockCtPayment);
    expect(mollieClient.orders_payments.create).toHaveBeenCalledWith(mockOrdersPaymentsParams);
    expect(createCtActions).toBeCalledWith(mockOrderPaymentResponse, mockCtPayment);
    expect(createOrderPaymentRes.status).toBe(201);
  });
  it('Should return commercetools formated error if one of the functions fails', async () => {
    const mockOrdersPaymentsParams = { orderId: 'ord_3uwvfd', method: 'ideal' };
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      paymentMethodInfo: {
        paymentInterface: 'Mollie',
        method: 'ideal',
      },
    } as CTPayment;
    const mockError = { statusCode: 404, title: 'Not found', message: 'No order exists with token ord_3uwvfd', field: undefined };
    const getOrdersPaymentsParams = jest.fn().mockReturnValueOnce(mockOrdersPaymentsParams);
    const createCtActions = jest.fn();
    const mollieClient = { orders_payments: { create: jest.fn().mockRejectedValueOnce(mockError) } } as any;

    const createOrderPaymentRes = await createOrderPayment(mockCtPayment, mollieClient, getOrdersPaymentsParams, createCtActions);
    expect(createOrderPaymentRes.status).toBe(400);
    expect(createOrderPaymentRes.errors).toHaveLength(1);
    expect(createOrderPaymentRes).toMatchSnapshot();
  });
});
