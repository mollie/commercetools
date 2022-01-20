import nock from 'nock';
import request from 'supertest';
import { CTTransactionState, CTTransactionType } from '../../src/types';
import _ from 'lodash';
import app from '../../src/app';
import Logger from '../../src/logger/logger';
import { mockAuthorizedOrder } from './mockResponses/mollieData/cancelOrder.data';

describe('Cancel partial order', () => {
  const mockLogError = jest.fn();

  const ctPaymentId = 'dfc2dcb0-10b8-4091-8334-687ce9db16ed';
  const mollieOrderId = 'ord_123456';
  const molliePaymentId = 'tr_GrP6dJRf3U';

  const baseMockCTPayment: any = {
    resource: {
      obj: {
        id: ctPaymentId,
        key: mollieOrderId,
        paymentMethodInfo: {
          paymentInterface: 'mollie',
        },
        amountPlanned: {
          currencyCode: 'EUR',
          centAmount: 50000,
        },
      },
    },
  };

  beforeAll(() => {
    // Prevent logs from cluttering test output
    Logger.error = mockLogError;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should cancel partial order line when lineIds contains objects and "CancelAuthorization" transaction is added to an authorized pay later order', async () => {
    const expectedDeleteParams = '{"lines":[{"id":"odl_1.pdue8w","quantity":1,"amount":{"value":"2.50","currency":"EUR"}}]}';
    const getOrderScope = nock('https://api.mollie.com/v2')
      .get(uri => uri.includes(mollieOrderId))
      .reply(200, mockAuthorizedOrder);
    const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}/lines`, expectedDeleteParams).reply(204);

    const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
    mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
    mockCTPaymentObj.resource.obj.transactions = [
      {
        id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
        type: CTTransactionType.Authorization,
        state: CTTransactionState.Success,
        amount: {
          currencyCode: 'EUR',
          centAmount: 674,
        },
        interactionId: molliePaymentId,
      },
      // Transaction added to trigger Cancel flow
      {
        id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
        type: CTTransactionType.CancelAuthorization,
        state: CTTransactionState.Initial,
        amount: {
          currencyCode: 'EUR',
          centAmount: 250,
        },
        custom: {
          fields: {
            lineIds: '[{"id":"d102ef48-89dd-428c-bad5-edbe2ef0bbca","quantity": 1,"totalPrice": {"currencyCode": "EUR","centAmount": 250,"fractionDigits": 2 } }]',
            includeShipping: false,
          },
        },
      },
    ];

    const res = await request(app).post('/').send(mockCTPaymentObj);
    const { status, body } = res;
    expect(status).toBe(200);

    // Check actions
    const { actions } = body;
    expect(actions).toHaveLength(4);
    const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
    expect(updateStateAction.state).toBe('Success');
    const interfaceInteraction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
    expect(interfaceInteraction.fields.actionType).toBe('cancelOrder');

    expect(cancelOrderScope.isDone()).toBe(true);
    expect(getOrderScope.isDone()).toBe(true);
    expect(cancelOrderScope.isDone()).toBe(true);
  });
  it('should cancel whole order line when lineIds contains id strings, shipping is included and "CancelAuthorization" transaction is added to an authorized pay later order', async () => {
    const expectedDeleteParams = '{"lines":[{"id":"odl_1.pdue8w"},{"id":"odl_1.vfuxoy"}]}';
    const getOrderScope = nock('https://api.mollie.com/v2')
      .get(uri => uri.includes(mollieOrderId))
      .reply(200, mockAuthorizedOrder);
    const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}/lines`, expectedDeleteParams).reply(204);

    const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
    mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
    mockCTPaymentObj.resource.obj.transactions = [
      {
        id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
        type: CTTransactionType.Authorization,
        state: CTTransactionState.Success,
        amount: {
          currencyCode: 'EUR',
          centAmount: 674,
        },
        interactionId: molliePaymentId,
      },
      // Transaction added to trigger Cancel flow
      {
        id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
        type: CTTransactionType.CancelAuthorization,
        state: CTTransactionState.Initial,
        amount: {
          currencyCode: 'EUR',
          centAmount: 250,
        },
        custom: {
          fields: {
            lineIds: 'd102ef48-89dd-428c-bad5-edbe2ef0bbca',
            includeShipping: true,
          },
        },
      },
    ];

    const res = await request(app).post('/').send(mockCTPaymentObj);
    const { status, body } = res;
    expect(status).toBe(200);

    // Check actions
    const { actions } = body;
    expect(actions).toHaveLength(4);
    const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
    expect(updateStateAction.state).toBe('Success');
    const interfaceInteraction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
    expect(interfaceInteraction.fields.actionType).toBe('cancelOrder');

    expect(cancelOrderScope.isDone()).toBe(true);
    expect(getOrderScope.isDone()).toBe(true);
    expect(cancelOrderScope.isDone()).toBe(true);
  });
});
