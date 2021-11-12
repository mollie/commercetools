import { mocked } from 'ts-jest/utils';
import { Action, ControllerAction } from '../../src/types';
import cancelOrder, { createCtActions, makeMollieLineAmounts } from '../../src/requestHandlers/cancelOrder';
import { makeActions, createDateNowString, makeMollieAmount } from '../../src/utils';
import Logger from '../../src/logger/logger';

jest.mock('../../src/utils');

describe('makeMollieLineAmounts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should transorm commercetools money to mollie amount object on lines', () => {
    mocked(makeMollieAmount).mockReturnValue({
      currency: "EUR",
      value: '18.00'
    });
    const mockedLines = [{
      id: '1',
      amount: {
        fractionDigits: 2,
        currencyCode: "EUR",
        centAmount: 1800
      }
    }]
    const expectedResult = [{
      id: '1',
      amount: {
        currency: "EUR",
        value: '18.00'
      }
    }]
    const transformedLineAmounts = makeMollieLineAmounts(mockedLines)
    expect(transformedLineAmounts).toEqual(expectedResult)
  })
  it('Should not fail if no amounts are present', () => {
    const mockedLines = [{
      id: '1',
      name: 'apple',
    }]
    const expectedResult = [{
      id: '1',
      name: 'apple',
    }]
    const transformedLineAmounts = makeMollieLineAmounts(mockedLines)
    expect(transformedLineAmounts).toEqual(expectedResult)
  })
})

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
  it('Should call mollie, handle response and return actions', async () => {
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
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);
    const mollieClient = { orders: { cancel: jest.fn().mockResolvedValueOnce(mockedCancelOrderResponse) } } as any;

    const cancelOrderRes = await cancelOrder(mockedCtObject, mollieClient, createCtActions);
    expect(mollieClient.orders.cancel).toHaveBeenCalledWith(mockedCtObject.key);
    expect(createCtActions).toBeCalledWith(mockedCancelOrderResponse, mockedCtObject);
    expect(cancelOrderRes.status).toBe(200);
  });
  it('Should return commercetools formated error if one of the functions fails', async () => {
    const mockedError = { status: 400, title: 'The order cannot be canceled from state: canceled', field: 'createCancelOrderRequest' };
    const createCtActions = jest.fn();
    const mollieClient = { orders: { cancel: jest.fn().mockRejectedValueOnce(mockedError) } } as any;

    const cancelOrderRes = await cancelOrder({}, mollieClient, createCtActions);
    expect(cancelOrderRes.status).toBe(400);
    expect(cancelOrderRes.errors).toHaveLength(1);
  });
});
