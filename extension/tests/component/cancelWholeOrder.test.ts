import nock from 'nock';
import request from 'supertest';
import { v4 as uuid } from 'uuid';
import { CTTransactionState, CTTransactionType } from '../../src/types';
import _ from 'lodash';
import { mocked } from 'ts-jest/utils';
import app from '../../src/app';
import config from '../../config/config';
import Logger from '../../src/logger/logger';
import { orderCanceled, cancelOrderError } from './mockResponses/mollieData/cancelOrder.data';

jest.mock('uuid');

describe('Create Refund', () => {
  const {
    commercetools: { authUrl },
  } = config;
  const mockLogDebug = jest.fn();
  const mockLogError = jest.fn();

  const ctPaymentId = 'dfc2dcb0-10b8-4091-8334-687ce9db16ed';
  const mollieOrderId = 'ord_8wmqcHMN4U';
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
        custom: {
          fields: {
            createPayment: '{}',
          },
        },
      },
    },
  };
  let authTokenScope: any;

  beforeAll(() => {
    // Ensure consistent uuid and datetime
    jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => '2021-11-10T14:02:45.858Z');
    mocked(uuid).mockReturnValue('b2bd1698-9923-4704-9729-02db2de495d1');
    // Credentials authentication flow is called first by commercetools client
    authTokenScope = nock(`${authUrl}`).persist().post('/oauth/token').reply(200, {
      access_token: 'vkFuQ6oTwj8_Ye4eiRSsqMeqLYNeQRJi',
      expires_in: 172800, // seconds (2 days)
      scope: 'manage_project:{projectKey}',
      token_type: 'Bearer',
    });
    // Prevent logs from cluttering test output
    Logger.debug = mockLogDebug;
    Logger.error = mockLogError;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    authTokenScope.persist(false);
  });

  describe('Happy Path', () => {
    it('should cancel whole order when "Refund" transaction is added to an unpaid pay now order', async () => {
      const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}`).reply(200, orderCanceled);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'ideal';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Charge,
          state: CTTransactionState.Pending,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
          interactionId: molliePaymentId,
        },
        // Transaction added to trigger Cancel flow
        {
          id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
          type: CTTransactionType.Refund,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
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

      expect(cancelOrderScope.isDone()).toBeTruthy();
    });

    it('should cancel whole order when "CancelAuthorization" transaction is added to an unauthorized pay later order', async () => {
      const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}`).reply(200, orderCanceled);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Pending,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
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
            centAmount: 90000,
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

      expect(cancelOrderScope.isDone()).toBeTruthy();
    });

    it('should cancel whole order when "CancelAuthorization" transaction is added to an authorized, but not captured, pay later order', async () => {
      const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}`).reply(200, orderCanceled);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Success,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
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
            centAmount: 90000,
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

      expect(cancelOrderScope.isDone()).toBeTruthy();
    });
  });

  describe('Unhappy Path', () => {
    it('should return error "CancelAuthorization" transaction is added to an already paid, (i.e. authorized and captured), pay later order', async () => {
      const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}`).reply(400, cancelOrderError);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Success,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
          interactionId: molliePaymentId,
        },
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Charge,
          state: CTTransactionState.Success,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
        },
        // Transaction added to trigger Cancel flow
        {
          id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
          type: CTTransactionType.CancelAuthorization,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;
      expect(status).toBe(400);

      const error = body.errors[0];
      expect(error).toEqual({
        code: 'SyntaxError',
        message: 'The order cannot be canceled from state: completed',
        extensionExtraInfo: {
          title: 'Bad Request',
          originalStatusCode: 400,
          links: {
            documentation: {
              href: 'https://docs.mollie.com/overview/handling-errors',
              type: 'text/html',
            },
          },
        },
      });

      expect(cancelOrderScope.isDone()).toBeTruthy();
    });
  });
});
