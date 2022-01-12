import { v4 as uuid } from 'uuid';
import { mocked } from 'ts-jest/utils';
import { Order } from '@mollie/api-client';
import { Action, ControllerAction, CTPayment } from '../../../src/types';
import cancelOrder, { getCancelOrderParams, createCtActions } from '../../../src/requestHandlers/cancelOrder';
import { createDateNowString } from '../../../src/utils';
import { makeActions } from '../../../src/makeActions';
import Logger from '../../../src/logger/logger';

jest.mock('uuid');
// jest.mock('../../../src/makeActions');

describe('getCancelOrderParams', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  // TODO: use this later in cancelOrder
  // it('Should create required params for mollie cancelOrder call', async () => {
  //   const mockCtPayment = {
  //     key: 'ord_3uwvfd',
  //   } as Required<CTPayment>;
  //   const expectedCancelOrderParams = {
  //     orderId: 'ord_3uwvfd',
  //   };
  //   await expect(getCancelOrderParams(mockCtPayment, undefined)).resolves.toEqual(expectedCancelOrderParams);
  // });
  it('Should create all optional params for mollie cancelOrder call when cancelling whole lines', async () => {
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      transactions: [
        {
          type: 'CancelAuthorization',
          state: 'Initial',
          custom: {
            fields: {
              lineIds: '3e632c95-8dc6-459a-9edc-5e64760abf21,  31fb05cd-6e00-42b4-a25d-68cceef5a603',
              includeShipping: true,
            },
          },
        },
      ],
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
      lines: [{ id: 'odl_1.tlaa3w' }, { id: 'odl_1.6997yo' }, { id: 'odl_1.cgark2' }],
    };
    await expect(getCancelOrderParams(mockCtPayment, mockOrderRes)).resolves.toEqual(expectedCancelOrderParams);
  });
  it('Should create all optional params for mollie cancelOrder call when cancelling partial lines', async () => {
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      transactions: [
        {
          type: 'CancelAuthorization',
          state: 'Initial',
          custom: {
            fields: {
              lineIds: '[{"id":"bfa19843-582e-4ba0-b72b-8e1ce156ad56","quantity": 2,"totalPrice": {"currencyCode": "EUR","centAmount": 500,"fractionDigits": 2 }}]',
              includeShipping: true,
            },
          },
        },
      ],
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
      lines: [{ id: 'odl_1.tlaa3w', quantity: 2, amount: { value: '5.00', currency: 'EUR' } }, { id: 'odl_1.cgark2' }],
    };
    await expect(getCancelOrderParams(mockCtPayment, mockOrderRes)).resolves.toEqual(expectedCancelOrderParams);
  });
  it('Should create required params for mollie createShipment call', async () => {
    const expectedError = { status: 400, title: 'Could not make parameters required to cancel Mollie order.', field: 'createCancelOrderRequest' };
    await expect(getCancelOrderParams(undefined as unknown as Required<CTPayment>, undefined)).rejects.toMatchObject(expectedError);
  });
});

describe.skip('createCtActions', () => {
  it('Should create correct ct actions from request and mollies response', () => {
    const mockedCtObject = {
      custom: {
        fields: {
          createCancelOrderRequest: '[]',
        },
      },
    };

    const mockedCancelOrderResponse: any = {
      resource: 'order',
      id: 'ord_jwtj05',
      profileId: 'pfl_VtWA783A63',
      amount: { value: '20.00', currency: 'EUR' },
      status: 'canceled',
      isCancelable: false,
      createdAt: '2021-11-01T12:20:39+00:00',
      canceledAt: '2021-11-02T12:26:44+00:00',
      redirectUrl: 'https://www.mollie.com/',
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.694ky5',
          orderId: 'ord_jwtj05',
          name: 'apple',
          sku: null,
          type: 'physical',
          status: 'canceled',
          isCancelable: false,
          quantity: 1,
          quantityShipped: 0,
          quantityCanceled: 1,
          amountCanceled: {},
          createdAt: '2021-11-01T12:20:39+00:00',
        },
      ],
    };
    mocked(makeActions.addInterfaceInteraction).mockReturnValue({
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        id: uuid(),
        actionType: ControllerAction.CancelOrder,
        createdAt: '2021-10-08T12:12:02.625Z',
        request: '[]',
        response: JSON.stringify(mockedCancelOrderResponse),
      },
    });
    mocked(makeActions.setCustomField).mockReturnValue({
      action: 'setCustomField',
      name: 'createCancelOrderResponse',
      value: JSON.stringify(mockedCancelOrderResponse),
    });
    const ctActions = createCtActions(mockedCancelOrderResponse, mockedCtObject);
    ctActions.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });
});

describe.skip('cancelOrder', () => {
  const mockLoggerError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLoggerError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should call mollie, handle response and return actions when cancelling complete order', async () => {
    const mockedCtObject: any = {
      key: 'ord_jwtj05',
      custom: {
        fields: {
          createCancelOrderRequest: '[]',
        },
      },
    };
    const mockedCancelOrderResponse: any = {
      resource: 'order',
      id: 'ord_jwtj05',
      profileId: 'pfl_VtWA783A63',
      amount: { value: '20.00', currency: 'EUR' },
      status: 'canceled',
      isCancelable: false,
      createdAt: '2021-11-01T12:20:39+00:00',
      canceledAt: '2021-11-02T12:26:44+00:00',
      redirectUrl: 'https://www.mollie.com/',
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.694ky5',
          orderId: 'ord_jwtj05',
          name: 'apple',
          sku: null,
          type: 'physical',
          status: 'canceled',
          isCancelable: false,
          quantity: 1,
          quantityShipped: 0,
          quantityCanceled: 1,
          amountCanceled: {},
          createdAt: '2021-11-01T12:20:39+00:00',
        },
      ],
    };
    const mockedCtActions: Action[] = [];
    const getCancelOrderParams = jest.fn().mockResolvedValueOnce({ orderId: 'ord_jwtj05', lines: [] });
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);
    const mollieClient = { orders: { cancel: jest.fn().mockResolvedValueOnce(mockedCancelOrderResponse) } } as any;

    const cancelOrderRes = await cancelOrder(mockedCtObject, mollieClient, getCancelOrderParams, createCtActions);
    expect(mollieClient.orders.cancel).toHaveBeenCalledWith(mockedCtObject.key);
    expect(createCtActions).toBeCalledWith(mockedCancelOrderResponse, mockedCtObject);
    expect(cancelOrderRes.status).toBe(200);
  });
  it('Should call mollie, handle response and return actions when cancelling partial order', async () => {
    const mockedCtObject: any = {
      key: 'ord_jwtj05',
      custom: {
        fields: {
          createCancelOrderRequest: '[{"id":"odl_1.694ky5","quantity":1,"amount":{"currencyCode":"EUR","centAmount":1430,"fractionDigits":2}}]',
        },
      },
    };
    const mockedCancelOrderParams = {
      orderId: 'ord_jwtj05',
      lines: [{ id: 'odl_1.694ky5', quantity: 1, amount: { currency: 'EUR', value: '14.30' } }],
    };
    const mockedCancelOrderResponse: any = {
      resource: 'order',
      id: 'ord_jwtj05',
      profileId: 'pfl_VtWA783A63',
      amount: { value: '14.30', currency: 'EUR' },
      status: 'canceled',
      isCancelable: false,
      createdAt: '2021-11-01T12:20:39+00:00',
      canceledAt: '2021-11-02T12:26:44+00:00',
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.694ky5',
          orderId: 'ord_jwtj05',
          name: 'apple',
          sku: null,
          type: 'physical',
          status: 'canceled',
          isCancelable: false,
          quantity: 1,
          quantityShipped: 0,
          quantityCanceled: 1,
          amountCanceled: {},
          createdAt: '2021-11-01T12:20:39+00:00',
        },
      ],
    };
    const mockedCtActions: Action[] = [];
    const getCancelOrderParams = jest.fn().mockResolvedValueOnce(mockedCancelOrderParams);
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);
    const mollieClient = { orders_lines: { cancel: jest.fn().mockResolvedValueOnce(mockedCancelOrderResponse) } } as any;

    const cancelOrderRes = await cancelOrder(mockedCtObject, mollieClient, getCancelOrderParams, createCtActions);
    expect(mollieClient.orders_lines.cancel).toHaveBeenCalledWith(mockedCancelOrderParams);
    expect(createCtActions).toBeCalledWith(mockedCancelOrderResponse, mockedCtObject);
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
