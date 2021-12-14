import { v4 as uuid } from 'uuid';
import { mocked } from 'ts-jest/utils';
import { Action, ControllerAction } from '../../../src/types';
import cancelOrder, { getCancelOrderParams, createCtActions } from '../../../src/requestHandlers/cancelOrder';
import { createDateNowString, makeMollieLineAmounts } from '../../../src/utils';
import { makeActions } from '../../../src/makeActions';
import Logger from '../../../src/logger/logger';

jest.mock('uuid');
jest.mock('../../../src/utils');
jest.mock('../../../src/makeActions');

describe('getCancelOrderParams', () => {
  const mockLogError = jest.fn();
  const mockUuid = '238e8459-06a1-46f6-95c6-cf3ce0998dce';
  beforeEach(() => {
    mocked(uuid).mockReturnValue(mockUuid);
    Logger.error = mockLogError;
    mocked(makeMollieLineAmounts).mockReturnValueOnce([{ id: 'odl_1.n3xdt3', quantity: 1, amount: { currency: 'EUR', value: '4.20' } }]);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create required params for mollie cancelOrder call', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          createCancelOrderRequest: '[{"id":"odl_1.n3xdt3","quantity":1,"amount":{"currencyCode":"EUR","centAmount":420,"fractionDigits":2}}]',
        },
      },
    };
    const expectedCreateCancelOrderParams = {
      orderId: 'ord_3uwvfd',
      lines: [{ id: 'odl_1.n3xdt3', quantity: 1, amount: { currency: 'EUR', value: '4.20' } }],
    };

    await expect(getCancelOrderParams(mockedCtObj)).resolves.toEqual(expectedCreateCancelOrderParams);
  });

  it('Should return 400 and error message if creating the parameters throws an error', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          createCancelOrderRequest: 'unparsableJson',
        },
      },
    };
    const expectedRejectedValue = {
      status: 400,
      title: 'Could not make parameters required to cancel Mollie order.',
      field: 'createCancelOrderRequest',
    };
    await expect(getCancelOrderParams(mockedCtObj)).rejects.toEqual(expectedRejectedValue);
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

describe('cancelOrder', () => {
  const mockLoggerError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLoggerError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should call mollie, handle response and return actions when cancelling complete order', async () => {
    const mockedCtObject = {
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
    const mockedCtObject = {
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

    const cancelOrderRes = await cancelOrder({}, mollieClient, getCancelOrderParams, createCtActions);
    expect(cancelOrderRes.status).toBe(400);
    expect(cancelOrderRes.errors).toHaveLength(1);
  });
});
