import nock from 'nock';
import request from 'supertest';
import { v4 as uuid } from 'uuid';
import { CTTransactionState, CTTransactionType } from '../../src/types';
import _ from 'lodash';
import { mocked } from 'ts-jest/utils';
import app from '../../src/app';
import config from '../../config/config';
import Logger from '../../src/logger/logger';
import { refundCreated, refundError422 } from './mockResponses/mollieData/createRefund.data';

jest.mock('uuid');

describe('Create Refund', () => {
  const {
    commercetools: { authUrl },
  } = config;
  const mockLogDebug = jest.fn();
  const mockLogError = jest.fn();

  const ctPaymentId = 'dfc2dcb0-10b8-4091-8334-687ce9db16ed';

  const baseMockCTPayment: any = {
    resource: {
      obj: {
        id: ctPaymentId,
        key: 'ord_1234',
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
    it('should return 201 and correct update actions when a partial refund is added against a pay later order', async () => {
      const molliePaymentId = 'tr_vsfkQmj4Fd';
      const createRefundScope = nock('https://api.mollie.com/v2').post(`/payments/${molliePaymentId}/refunds`).reply(201, refundCreated);

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
          id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
          type: CTTransactionType.Charge,
          state: CTTransactionState.Success,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
        },
        // Transaction added to trigger Refund flow
        {
          id: 'e5f86ecd-0605-4e4f-be21-745cc33c338b',
          type: CTTransactionType.Refund,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 5500,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;
      expect(status).toBe(201);

      // Check actions
      const { actions } = body;
      expect(actions).toHaveLength(4);
      const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
      expect(updateStateAction.state).toBe('Pending');
      const updateIteractionIdAction = actions.find((action: any) => action.action === 'changeTransactionInteractionId');
      expect(updateIteractionIdAction.interactionId).toBe(refundCreated.id);
      expect(updateStateAction.state).toBe('Pending');
      actions.forEach((action: any) => {
        expect(action).toMatchSnapshot();
      });

      expect(createRefundScope.isDone()).toBeTruthy();
    });

    it('should return 201 and correct update actions when a partial refund is added against a pay now order', async () => {
      const molliePaymentId = 'tr_kT7USTNHzR';
      const createRefundScope = nock('https://api.mollie.com/v2').post(`/payments/${molliePaymentId}/refunds`).reply(201, refundCreated);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'ideal';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
          type: CTTransactionType.Charge,
          state: CTTransactionState.Success,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
          interactionId: molliePaymentId,
        },
        // Transaction added to trigger Refund flow
        {
          id: 'e5f86ecd-0605-4e4f-be21-745cc33c338b',
          type: CTTransactionType.Refund,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 5500,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;
      expect(status).toBe(201);

      // Check actions
      const { actions } = body;
      expect(actions).toHaveLength(4);
      const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
      expect(updateStateAction.state).toBe('Pending');
      const updateIteractionIdAction = actions.find((action: any) => action.action === 'changeTransactionInteractionId');
      expect(updateIteractionIdAction.interactionId).toBe(refundCreated.id);
      actions.forEach((action: any) => {
        expect(action).toMatchSnapshot();
      });

      expect(createRefundScope.isDone()).toBeTruthy();
    });
  });

  describe('Unhappy Path', () => {
    it('should return 400 and error message when refund is added to an unpaid pay later order', async () => {
      const molliePaymentId = 'tr_gt8USTNHeF';
      const createRefundScope = nock('https://api.mollie.com/v2').post(`/payments/${molliePaymentId}/refunds`).reply(201, refundCreated);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Pending,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
          interactionId: molliePaymentId,
        },
        // Transaction added to trigger Refund flow
        {
          id: 'e5f86ecd-0605-4e4f-be21-745cc33c338b',
          type: CTTransactionType.Refund,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 5500,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;
      expect(status).toBe(400);

      const error = body.errors[0];
      expect(error).toEqual({
        code: 'SyntaxError',
        message: 'Cannot create a Refund without a successful capture',
        extensionExtraInfo: { originalStatusCode: 400 },
      });
      expect(createRefundScope.isDone()).toBeFalsy();
    });

    it('should return 400 and error message when refund is added to an unshipped pay later order', async () => {
      const molliePaymentId = 'tr_gh6USTNHeF';
      const createRefundScope = nock('https://api.mollie.com/v2').post(`/payments/${molliePaymentId}/refunds`).reply(201, refundCreated);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Success,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
          interactionId: molliePaymentId,
        },
        // Transaction added to trigger Refund flow
        {
          id: 'e5f86ecd-0605-4e4f-be21-745cc33c338b',
          type: CTTransactionType.Refund,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 5500,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;
      expect(status).toBe(400);

      const error = body.errors[0];
      expect(error).toEqual({
        code: 'SyntaxError',
        message: 'Cannot create a Refund without a successful capture',
        extensionExtraInfo: { originalStatusCode: 400 },
      });
      expect(createRefundScope.isDone()).toBeFalsy();
    });

    it('should return 400 and error message when refund is added to a pay now order, for a greater amount than the captured funds', async () => {
      const molliePaymentId = 'tr_gh6USNGGqP';
      const createRefundScope = nock('https://api.mollie.com/v2').post(`/payments/${molliePaymentId}/refunds`).reply(422, refundError422);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'ideal';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
          type: CTTransactionType.Charge,
          state: CTTransactionState.Success,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
          interactionId: molliePaymentId,
        },
        // Transaction added to trigger Refund flow
        {
          id: 'e5f86ecd-0605-4e4f-be21-745cc33c338b',
          type: CTTransactionType.Refund,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 91000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;
      expect(status).toBe(400);

      const error = body.errors[0];
      expect(error).toEqual({
        code: 'SemanticError',
        message: 'The specified amount cannot be refunded',
        extensionExtraInfo: {
          title: 'Unprocessable Entity',
          field: 'amount.value',
          originalStatusCode: 422,
          links: {
            documentation: {
              href: 'https://docs.mollie.com/overview/handling-errors',
              type: 'text/html',
            },
          },
        },
      });
      expect(createRefundScope.isDone()).toBeTruthy();
    });
  });
});
