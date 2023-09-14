import { v4 as uuid } from 'uuid';
import { Order } from '@mollie/api-client';
import { Action, CTPayment, CTTransaction } from '../../../src/types';
import cancelOrder, { getCancelOrderParams, createCtActions } from '../../../src/requestHandlers/cancelOrder';
import { isPartialTransaction, createDateNowString, mollieToCtLines, findInitialTransaction, ctToMollieLines, ctToMollieOrderId } from '../../../src/utils';
import Logger from '../../../src/logger/logger';

jest.mock('uuid');
jest.mock('../../../src/utils.ts');

describe('getCancelOrderParams', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create all optional params for mollie cancelOrder call when cancelling whole lines', async () => {
    const mockTransaction = {
      type: 'CancelAuthorization',
      state: 'Initial',
      custom: {
        fields: {
          lineIds: '3e632c95-8dc6-459a-9edc-5e64760abf21,  31fb05cd-6e00-42b4-a25d-68cceef5a603',
          includeShipping: true,
        },
      },
    } as CTTransaction;
    const mockMollieLines = [{ id: 'odl_1.tlaa3w' }, { id: 'odl_1.6997yo' }, { id: 'odl_1.cgark2' }];
    jest.mocked(findInitialTransaction).mockReturnValue(mockTransaction);
    jest.mocked(ctToMollieLines).mockReturnValue(mockMollieLines);
    jest.mocked(ctToMollieOrderId).mockReturnValue('ord_3uwvfd');
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      transactions: [mockTransaction],
    } as Required<CTPayment>;
    const mockOrderRes = {
      lines: [
        {
          id: 'odl_1.tlaa3w',
          orderId: 'ord_3uwvfd',
          name: 'Banaan',
          metadata: { cartLineItemId: '3e632c95-8dc6-459a-9edc-5e64760abf21' },
          quantity: 2,
          totalAmount: { value: '1.42', currency: 'EUR' },
        },
        {
          id: 'odl_1.5zqqm',
          orderId: 'ord_3uwvfd',
          name: 'Apple',
          metadata: { cartLineItemId: 'd02457cc-fceb-4588-9bdb-c93d4295b261' },
          quantity: 4,
          totalAmount: { value: '7.12', currency: 'EUR' },
        },
        {
          id: 'odl_1.6997yo',
          orderId: 'ord_3uwvfd',
          name: 'Gift wrapping service',
          metadata: { cartCustomLineItemId: '31fb05cd-6e00-42b4-a25d-68cceef5a603' },
          quantity: 1,
          totalAmount: { value: '7.50', currency: 'EUR' },
        },
        {
          id: 'odl_1.cgark2',
          orderId: 'ord_3uwvfd',
          name: 'Shipping - Standard Shipping',
          metadata: null,
          type: 'shipping_fee',
          quantity: 1,
          totalAmount: { value: '0.00', currency: 'EUR' },
        },
      ],
    } as Order;
    const expectedCancelOrderParams = {
      orderId: 'ord_3uwvfd',
      lines: mockMollieLines,
    };

    await expect(getCancelOrderParams(mockCtPayment, mockOrderRes)).resolves.toEqual(expectedCancelOrderParams);
  });
  it('Should create all optional params for mollie cancelOrder call when cancelling partial lines', async () => {
    const mockTransaction = {
      type: 'CancelAuthorization',
      state: 'Initial',
      custom: {
        fields: {
          lineIds: '[{"id":"bfa19843-582e-4ba0-b72b-8e1ce156ad56","quantity": 2,"totalPrice": {"currencyCode": "EUR","centAmount": 500,"fractionDigits": 2 }}]',
          includeShipping: true,
        },
      },
    } as CTTransaction;
    const mockMollieLines = [{ id: 'odl_1.tlaa3w', quantity: 2, amount: { value: '5.00', currency: 'EUR' } }, { id: 'odl_1.cgark2' }];
    jest.mocked(findInitialTransaction).mockReturnValue(mockTransaction);
    jest.mocked(ctToMollieLines).mockReturnValue(mockMollieLines);
    jest.mocked(ctToMollieOrderId).mockReturnValue('ord_3uwvfd');

    const mockCtPayment = {
      key: 'ord_3uwvfd',
      transactions: [mockTransaction],
    } as Required<CTPayment>;
    const mockOrderRes = {
      lines: [
        {
          id: 'odl_1.tlaa3w',
          orderId: 'ord_3uwvfd',
          name: 'Banaan',
          metadata: { cartLineItemId: 'bfa19843-582e-4ba0-b72b-8e1ce156ad56' },
          quantity: 4,
          totalAmount: { value: '10.00', currency: 'EUR' },
        },
        {
          id: 'odl_1.cgark2',
          orderId: 'ord_3uwvfd',
          name: 'Shipping - Standard Shipping',
          metadata: null,
          type: 'shipping_fee',
          quantity: 1,
          totalAmount: { value: '0.00', currency: 'EUR' },
        },
      ],
    } as Order;
    const expectedCancelOrderParams = {
      orderId: 'ord_3uwvfd',
      lines: mockMollieLines,
    };
    await expect(getCancelOrderParams(mockCtPayment, mockOrderRes)).resolves.toEqual(expectedCancelOrderParams);
  });
  it('Should create required params for mollie createShipment call', async () => {
    const expectedError = { status: 400, title: 'Could not make parameters required to cancel Mollie order.', field: 'createCancelOrderRequest' };
    await expect(getCancelOrderParams(undefined as unknown as Required<CTPayment>, undefined)).rejects.toMatchObject(expectedError);
  });
});

describe('createCtActions', () => {
  beforeEach(() => {
    const mockUuid = '3fea7470-5434-4056-a829-a187339e94d8';
    jest.mocked(uuid).mockReturnValue(mockUuid);
    jest.mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create correct ct actions from request and mollies payment for order lines (mollie response is true)', () => {
    const initialTransaction = {
      id: '869ea4f0-b9f6-4006-bf04-d8306b5c9564',
      type: 'CancelAuthorization',
      state: 'Initial',
      custom: {
        fields: {
          lineIds: '3e632c95-8dc6-459a-9edc-5e64760abf21,  31fb05cd-6e00-42b4-a25d-68cceef5a603',
          includeShipping: true,
        },
      },
    } as CTTransaction;
    jest.mocked(findInitialTransaction).mockReturnValue(initialTransaction);
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      transactions: [initialTransaction],
    } as Required<CTPayment>;
    // When cancelling order lines the response is 204 No content - comes out as true
    const mockCancelOrderResponse = true;
    const ctActions = createCtActions(mockCancelOrderResponse, mockCtPayment);
    ctActions.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });
  it('Should create correct ct actions from request and mollies payment for whole cancel order (mollie response is object)', () => {
    const initialTransaction = {
      id: '869ea4f0-b9f6-4006-bf04-d8306b5c9564',
      type: 'CancelAuthorization',
      state: 'Initial',
      custom: { fields: {} },
    } as CTTransaction;
    jest.mocked(findInitialTransaction).mockReturnValue(initialTransaction);
    jest.mocked(mollieToCtLines).mockReturnValue('42c6d1fd-b942-433b-b6dd-41062c4b3a42');
    const mockCtPayment = {
      key: 'ord_1wg40y',
      transactions: [initialTransaction],
    } as Required<CTPayment>;
    const mockCancelOrderResponse = {
      resource: 'order',
      id: 'ord_1wg40y',
      method: 'klarnapaylater',
      amount: { value: '8.46', currency: 'EUR' },
      status: 'canceled',
      canceledAt: '2022-01-12T12:10:41+00:00',
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.vdfeus',
          orderId: 'ord_1wg40y',
          name: 'Banana',
          status: 'canceled',
          metadata: { cartLineItemId: '42c6d1fd-b942-433b-b6dd-41062c4b3a42' },
          quantity: 2,
          totalAmount: { value: '8.46', currency: 'EUR' },
        },
      ],
    } as Order;
    const ctActions = createCtActions(mockCancelOrderResponse, mockCtPayment);
    ctActions.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });
});

describe('cancelOrder', () => {
  const mockLoggerError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLoggerError;
    jest.mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should call mollie, handle response and return actions when cancelling complete order', async () => {
    jest.mocked(isPartialTransaction).mockReturnValue(false);
    jest.mocked(ctToMollieOrderId).mockReturnValue('ord_jwtj05');
    const mockedCtPayment: any = {
      key: 'ord_jwtj05',
    };
    const mockedCancelOrderResponse = {
      resource: 'order',
      id: 'ord_jwtj05',
      profileId: 'pfl_VtWA783A63',
      amount: { value: '20.00', currency: 'EUR' },
      status: 'canceled',
      isCancelable: false,
      createdAt: '2021-11-01T12:20:39+00:00',
      canceledAt: '2021-11-02T12:26:44+00:00',
      lines: [
        {
          id: 'odl_1.694ky5',
          orderId: 'ord_jwtj05',
          name: 'apple',
          status: 'canceled',
          quantity: 1,
        },
      ],
    } as Order;
    const mockedCtActions: Action[] = [];
    const getCancelOrderParams = jest.fn().mockResolvedValueOnce({ orderId: 'ord_jwtj05', lines: [] });
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);
    const mollieClient = { orders: { cancel: jest.fn().mockResolvedValueOnce(mockedCancelOrderResponse) } } as any;

    const cancelOrderRes = await cancelOrder(mockedCtPayment, mollieClient, getCancelOrderParams, createCtActions);
    expect(mollieClient.orders.cancel).toHaveBeenCalledWith(mockedCtPayment.key);
    expect(createCtActions).toBeCalledWith(mockedCancelOrderResponse, mockedCtPayment);
    expect(cancelOrderRes.status).toBe(200);
  });
  it('Should call mollie, handle response and return actions when cancelling partial order', async () => {
    jest.mocked(isPartialTransaction).mockReturnValue(true);
    const mockedCtPayment: any = {
      key: 'ord_jwtj05',
      transactions: [
        {
          type: 'CancelAuthorization',
          state: 'Initial',
          custom: {
            fields: {
              lineIds: '[{"id":"3e632c95-8dc6-459a-9edc-5e64760abf21","quantity": 2,"totalPrice": {"currencyCode": "EUR","centAmount": 142,"fractionDigits": 2 }}]',
              includeShipping: true,
            },
          },
        },
      ],
    };
    const mockedCancelOrderParams: any = {
      orderId: 'ord_jwtj05',
      lines: [{ id: 'odl_1.694ky5', quantity: 2, amount: { currency: 'EUR', value: '1.42' } }],
    };
    const mockedOrderResponse: any = {
      id: 'ord_jwtj05',
      amount: { value: '2.84', currency: 'EUR' },
      createdAt: '2021-11-01T12:20:39+00:00',
      lines: [
        {
          id: 'odl_1.694ky5',
          orderId: 'ord_jwtj05',
          name: 'Banaan',
          metadata: { cartLineItemId: '3e632c95-8dc6-459a-9edc-5e64760abf21' },
          quantity: 2,
          totalAmount: { value: '1.42', currency: 'EUR' },
        },
      ],
    };
    const mockedCtActions: Action[] = [];
    const getCancelOrderParams = jest.fn().mockResolvedValueOnce(mockedCancelOrderParams);
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);
    const mollieClient = {
      orders: { get: jest.fn().mockResolvedValueOnce(mockedOrderResponse) },
      orders_lines: { cancel: jest.fn().mockResolvedValueOnce(true) },
    } as any;

    const cancelOrderRes = await cancelOrder(mockedCtPayment, mollieClient, getCancelOrderParams, createCtActions);
    expect(mollieClient.orders.get).toHaveBeenCalledWith(mockedCtPayment.key);
    expect(mollieClient.orders_lines.cancel).toHaveBeenCalledWith(mockedCancelOrderParams);
    expect(getCancelOrderParams).toHaveBeenCalledWith(mockedCtPayment, mockedOrderResponse);
    expect(createCtActions).toBeCalledWith(true, mockedCtPayment);
    expect(cancelOrderRes.status).toBe(200);
  });
  it('Should return commercetools formated error if one of the functions fails', async () => {
    const mockedError = { status: 400, title: 'The order cannot be canceled from state: canceled', field: 'createCancelOrderRequest' };
    const createCtActions = jest.fn();
    const getCancelOrderParams = jest.fn();
    const mollieClient = { orders: { cancel: jest.fn().mockRejectedValueOnce(mockedError) } } as any;

    const cancelOrderRes = await cancelOrder({} as any, mollieClient, getCancelOrderParams, createCtActions);
    expect(cancelOrderRes.status).toBe(400);
    expect(cancelOrderRes.errors).toHaveLength(1);
  });
});
