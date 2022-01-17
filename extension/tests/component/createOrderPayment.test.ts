import nock from 'nock';
import request from 'supertest';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import { mocked } from 'ts-jest/utils';
import app from '../../src/app';
import config from '../../config/config';
import Logger from '../../src/logger/logger';
import { orderPaymentWithIDEAL, orderPaymentWithKlarna, orderHasOpenPaymentError } from './mockResponses/mollieData/createOrderPayment.data';
import { CTTransactionState, CTTransactionType } from '../../src/types';

jest.mock('uuid');

describe('Create Order Payment', () => {
  const {
    commercetools: { authUrl },
  } = config;
  const mockLogError = jest.fn();

  const paymentId = 'd75d0b1d-64c5-4c8f-86f6-b9510332e743';
  const mollieOrderId = 'ord_mzvyt8';
  const baseMockCTPaymentObj: any = {
    resource: {
      obj: {
        id: paymentId,
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
    Logger.error = mockLogError;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    authTokenScope.persist(false);
  });

  describe('Happy Path', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    it('Should return 201 when a new payment is created against the mollie order, changing from pay now (iDEAL) to pay later method (klarna)', async () => {
      const orderPaymentCreatedScope = nock('https://api.mollie.com/v2').post(`/orders/${mollieOrderId}/payments`, { method: 'klarnapaylater' }).reply(201, orderPaymentWithKlarna);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPaymentObj);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Charge,
          state: CTTransactionState.Failure,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
        },
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
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
      expect(updateIteractionIdAction.interactionId).toBe(orderPaymentWithKlarna.id);
      expect(updateStateAction.state).toBe('Pending');
      actions.forEach((action: any) => {
        expect(action).toMatchSnapshot();
      });

      expect(orderPaymentCreatedScope.isDone()).toBeTruthy();
    });

    it('Should return 201 when a new payment is created against the mollie order, changing from pay later (klarna) to pay now method (iDEAL)', async () => {
      const orderPaymentCreatedScope = nock('https://api.mollie.com/v2').post(`/orders/${mollieOrderId}/payments`, { method: 'ideal' }).reply(201, orderPaymentWithIDEAL);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPaymentObj);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'ideal';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Failure,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
        },
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Charge,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
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
      expect(updateIteractionIdAction.interactionId).toBe(orderPaymentWithIDEAL.id);
      expect(updateStateAction.state).toBe('Pending');
      actions.forEach((action: any) => {
        expect(action).toMatchSnapshot();
      });

      expect(orderPaymentCreatedScope.isDone()).toBeTruthy();
    });

    it('Should return 201 when a new payment is created against the mollie order, changing payment method from klarnasliceit to klarnapaylater', async () => {
      const orderPaymentCreatedScope = nock('https://api.mollie.com/v2').post(`/orders/${mollieOrderId}/payments`, { method: 'klarnapaylater' }).reply(201, orderPaymentWithKlarna);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPaymentObj);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Failure,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
        },
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
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
      expect(updateIteractionIdAction.interactionId).toBe(orderPaymentWithKlarna.id);
      expect(updateStateAction.state).toBe('Pending');
      actions.forEach((action: any) => {
        expect(action).toMatchSnapshot();
      });

      expect(orderPaymentCreatedScope.isDone()).toBeTruthy();
    });
  });

  describe('Unhappy Path', () => {
    it('Should return 400 when the mollie order has an open payment', async () => {
      const orderWithOpenPaymentScope = nock('https://api.mollie.com/v2').post(`/orders/${mollieOrderId}/payments`, { method: 'klarnapaylater' }).reply(422, orderHasOpenPaymentError);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPaymentObj);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Charge,
          state: CTTransactionState.Pending,
          amount: {
            currencyCode: 'EUR',
            centAmount: 50000,
          },
        },
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 50000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);

      const { status, body } = res;
      expect(status).toBe(400);

      const { errors } = body;
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        code: 'SemanticError',
        message: 'Cannot create a new payment for order ord_byxxzq when it has an open payment.',
        extensionExtraInfo: {
          originalStatusCode: 422,
          title: 'Unprocessable Entity',
          links: {
            documentation: {
              href: 'https://docs.mollie.com/overview/handling-errors',
              type: 'text/html',
            },
          },
        },
      });
      expect(orderWithOpenPaymentScope.isDone()).toBeTruthy();
    });
  });
});
