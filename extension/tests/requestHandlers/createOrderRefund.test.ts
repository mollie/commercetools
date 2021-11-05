import { mocked } from 'ts-jest/utils';
import Logger from '../../src/logger/logger';
import { createDateNowString } from '../../src/utils';
import createOrderRefund, { createCtActions, getOrderRefundParams, extractLinesCtToMollie } from '../../src/requestHandlers/createOrderRefund';
import { Action, ControllerAction, CTTransactionType } from '../../src/types';
import { Amount } from '@mollie/api-client/dist/types/src/data/global';

jest.mock('../../src/utils');

describe('createOrderRefund', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create correct ct actions from correct request and response', () => {
    const mockedCtRequestObject = {
      custom: {
        fields: {
          createOrderRefundRequest: '{ "lines": [], "description": "Order refund requested", "metadata": {} }',
        },
      },
    };
    const mockedMollieResponseObject = {
      resource: 'refund',
      id: 're_dJmkemAMzM',
      amount: { value: '10.00', currency: 'EUR' },
      status: 'pending',
      createdAt: '2021-11-03T09:20:27+00:00',
      description: 'Order refund requested',
      metadata: {},
      orderId: 'ord_qitsrz',
      paymentId: 'tr_UjzkRQ4Cpq',
      settlementAmount: { value: '-10.00', currency: 'EUR' },
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.o2otu5',
          orderId: 'ord_qitsrz',
          name: 'apple',
          sku: null,
          type: 'physical',
          status: 'paid',
          metadata: {},
          isCancelable: false,
          quantity: 1,
          vatRate: '20.00',
          createdAt: '2021-11-03T09:19:52+00:00',
        },
      ],
    };
    const ctActions = createCtActions(mockedMollieResponseObject, mockedCtRequestObject);
    ctActions.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });
  it('Should correctly call mollies createRefund endpoint and return expected update actions', async () => {
    const mockedCtRequestObject = {
      key: 'ord_qitsrz',
      custom: {
        fields: {
          createOrderRefundRequest: '{ "lines": [], "description": "Order refund requested", "metadata": {} }',
        },
      },
    };
    const mockedCtStringifiedRequestObject = {
      description: 'Order refund requested',
      lines: [],
      metadata: {},
      orderId: 'ord_qitsrz',
    };
    const mockedMollieResponseObject = {
      resource: 'refund',
      id: 're_dJmkemAMzM',
      amount: { value: '10.00', currency: 'EUR' },
      status: 'pending',
      createdAt: '2021-11-03T09:20:27+00:00',
      description: 'Order refund requested',
      metadata: {},
      orderId: 'ord_qitsrz',
      paymentId: 'tr_UjzkRQ4Cpq',
      settlementAmount: { value: '-10.00', currency: 'EUR' },
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.o2otu5',
          orderId: 'ord_qitsrz',
          name: 'apple',
          sku: null,
          type: 'physical',
          status: 'paid',
          metadata: {},
          isCancelable: false,
          quantity: 1,
          vatRate: '20.00',
          createdAt: '2021-11-03T09:19:52+00:00',
        },
      ],
    };
    const mockedStringifiedResponse = JSON.stringify(mockedMollieResponseObject);
    const mockedCtActions: Action[] = [
      {
        action: 'addInterfaceInteraction',
        type: {
          key: 'ct-mollie-integration-interface-interaction-type',
        },
        fields: {
          actionType: ControllerAction.CreateOrderRefund,
          createdAt: '2021-11-03T09:20:27+00:00',
          request: '{ "lines": [], "description": "Order refund requested", "metadata": {} }',
          response: mockedStringifiedResponse,
        },
      },
      {
        action: 'setCustomField',
        name: 'createOrderRefundResponse',
        value: JSON.stringify(mockedMollieResponseObject),
      },
      {
        action: 'addTransaction',
        transaction: {
          amount: {
            centAmount: 1000,
            currencyCode: 'EUR',
          },
          type: CTTransactionType.Refund,
          interactionId: 're_dJmkemAMzM',
          state: 'Initial',
          timestamp: '2021-10-08T12:12:02.625Z',
        },
      },
    ];
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);
    const mollieClient = { orders_refunds: { create: jest.fn().mockResolvedValueOnce(mockedMollieResponseObject) } } as any;
    const createOrderRefundRes = await createOrderRefund(mockedCtRequestObject, mollieClient, createCtActions);
    expect(mollieClient.orders_refunds.create).toBeCalledWith(mockedCtStringifiedRequestObject);
    expect(createOrderRefundRes.status).toBe(201);
    expect(createCtActions).toBeCalledWith(mockedMollieResponseObject, mockedCtRequestObject);
  });
  it('Should return correct error if custom fields on commercetools are formatted incorrectly', async () => {
    const mockedError = { status: 400, title: 'The order cannot be refunded', field: 'createOrderRefundRequest' };
    const mollieClient = { orders_refunds: { create: jest.fn().mockRejectedValueOnce(mockedError) } } as any;
    const mockedCtActions: Action[] = [];
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);

    const cancelOrderRes = await createOrderRefund({}, mollieClient, createCtActions);
    expect(cancelOrderRes.status).toBe(400);
    expect(cancelOrderRes.errors).toHaveLength(1);
  });
  it('Should extract the correct order parameters from the ct object', async () => {
    const mockedCtRequestObject = {
      key: 'ord_qitsrz',
      custom: {
        fields: {
          createOrderRefundRequest: '{ "lines": [], "description": "Order refund requested", "metadata": {} }',
        },
      },
    };
    const mockedOrderParamsResponse = {
      lines: [],
      description: 'Order refund requested',
      metadata: {},
    };
    const testedOrderParamsResponse = await getOrderRefundParams(mockedCtRequestObject);
    expect(testedOrderParamsResponse).toMatchObject(mockedOrderParamsResponse);
  });
  it('Should convert a commercetools-formatted order line to a mollie-formatted order line', () => {
    const mockedCtOrderLines = [
      {
        id: 'odl_1.49ejqh',
        quantity: 3,
        amount: {
          centAmount: 1000,
          currencyCode: 'EUR',
        },
      },
    ];
    const mockedMollieOrderLines = [
      {
        id: 'odl_1.49ejqh',
        quantity: 3,
        amount: {
          value: '10.00',
          currency: 'EUR',
        },
      },
    ];
    expect(extractLinesCtToMollie(mockedCtOrderLines)).toMatchObject(mockedMollieOrderLines);
  });
});
