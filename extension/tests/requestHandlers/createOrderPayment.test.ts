import { mocked } from 'ts-jest/utils';
import createOrderPayment, { getOrdersPaymentsParams, createCtActions } from '../../src/requestHandlers/createOrderPayment';
import { Action } from '../../src/types';
import { createDateNowString } from '../../src/utils';
import Logger from '../../src/logger/logger';

jest.mock('../../src/utils');

describe('getOrdersPaymentsParams', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create required params for mollie createOrderPayment call', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          createOrderPaymentRequest: '{}',
        },
      },
    };
    const expectedCreateOrderPaymentParams = {
      orderId: 'ord_3uwvfd',
    };
    await expect(getOrdersPaymentsParams(mockedCtObj)).resolves.toEqual(expectedCreateOrderPaymentParams);
  });
  it('Should create all optional params for mollie createOrderPayment call', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          createOrderPaymentRequest: '{"method":["creditcard", "applepay"],"customerId":"cst_8wmqcHMN4U","mandateId":"mdt_h3gAaD5zP"}',
        },
      },
    };
    const expectedCreateOrderPaymentParams = {
      orderId: 'ord_3uwvfd',
      method: ['creditcard', 'applepay'],
      mandateId: 'mdt_h3gAaD5zP',
      customerId: 'cst_8wmqcHMN4U',
    };
    await expect(getOrdersPaymentsParams(mockedCtObj)).resolves.toEqual(expectedCreateOrderPaymentParams);
  });
  it('Should return error if creating params for createOrderPayment fails', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          createOrderPaymentRequest: 'something_json_parse_cannot_handle',
        },
      },
    };
    const expectedError = { status: 400, title: 'Could not make parameters needed to create Mollie order payment.', field: 'createOrderPaymentRequest' };
    await expect(getOrdersPaymentsParams(mockedCtObj)).rejects.toEqual(expectedError);
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});
describe('createCtActions', () => {
  beforeEach(() => {
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create correct ct actions from request and mollies payment', () => {
    const mockedCtObject = {
      amountPlanned: {
        currencyCode: 'EUR',
        centAmount: 420,
      },
      custom: { fields: { createOrderPaymentRequest: '{"method":"creditcard"}' } },
    };
    const mockedOrderPaymentResponse: any = {
      resource: 'payment',
      id: 'tr_mAmMrPGnxe',
      createdAt: '2021-10-20T15:35:13+00:00',
      amount: { value: '4.20', currency: 'EUR' },
      description: 'Order 1001',
      method: null,
      status: 'open',
      profileId: 'pfl_VtWA783A63',
      orderId: 'ord_3uwvfd',
    };
    const ctActions = createCtActions(mockedOrderPaymentResponse, mockedCtObject);
    ctActions.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });
});
describe('createOrderPayment', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should prepare params, call mollie, handle response and return actions', async () => {
    const mockedOrdersPaymentsParams = { orderId: 'ord_3uwvfd' };
    const mockedCtObject = {
      amountPlanned: {
        currencyCode: 'EUR',
        centAmount: 420,
      },
      custom: { fields: { createOrderPaymentRequest: '{"method":"creditcard"}' } },
    };
    const mockedOrderPaymentResponse: any = {
      resource: 'payment',
      id: 'tr_mAmMrPGnxe',
      createdAt: '2021-10-20T15:35:13+00:00',
      amount: { value: '4.20', currency: 'EUR' },
      description: 'Order 1001',
      method: null,
      status: 'open',
      profileId: 'pfl_VtWA783A63',
      orderId: 'ord_3uwvfd',
    };
    const mockedCtActions: Action[] = [];
    const getOrdersPaymentsParams = jest.fn().mockResolvedValueOnce(mockedOrdersPaymentsParams);
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);
    const mollieClient = { orders_payments: { create: jest.fn().mockResolvedValueOnce(mockedOrderPaymentResponse) } } as any;

    const createOrderPaymentRes = await createOrderPayment(mockedCtObject, mollieClient, getOrdersPaymentsParams, createCtActions);
    expect(getOrdersPaymentsParams).toBeCalledWith(mockedCtObject);
    expect(mollieClient.orders_payments.create).toHaveBeenCalledWith(mockedOrdersPaymentsParams);
    expect(createCtActions).toBeCalledWith(mockedOrderPaymentResponse, mockedCtObject);
    expect(createOrderPaymentRes.status).toBe(201);
  });
  it('Should return commercetools formated error if one of the functions fails', async () => {
    const mockedError = { status: 400, title: 'Could not make parameters needed to create Mollie order payment.', field: 'createOrderPaymentRequest' };
    const getOrdersPaymentsParams = jest.fn().mockRejectedValueOnce(mockedError);
    const createCtActions = jest.fn();
    const mollieClient = { orders_payments: { create: jest.fn() } } as any;

    const createOrderPaymentRes = await createOrderPayment({}, mollieClient, getOrdersPaymentsParams, createCtActions);
    expect(createOrderPaymentRes.status).toBe(400);
    expect(createOrderPaymentRes.errors).toHaveLength(1);
  });
});
