import nock from 'nock';
import request from 'supertest';
import app from '../../src/app';
import config from '../../config/config';
import Logger from '../../src/logger/logger';

import { noCartFoundForGivenPaymentId, cartFoundWith2LineItemsForGivenPaymentId } from './mockResponses/commercetoolsData/cartResponses.data';
import { paymentMethodNotEnabledInProfile, amountLowerThanMinimumKlarnaSliceIt, orderCreatedWithIdeal } from './mockResponses/mollieData/createOrder.data';
// Data required:
// Successfully created order in mollie - pay now / pay later

describe('Create Order', () => {
  const {
    commercetools: { host, projectKey, authUrl },
  } = config;
  const mockLogDebug = jest.fn();
  const mockLogError = jest.fn();

  const paymentId = '2c24f3ef-56fb-4c05-8854-dde13c77554e';
  const baseMockCTPaymentObj: any = {
    resource: {
      obj: {
        id: paymentId,
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

  describe('Unhappy Path', () => {
    it('Payment not linked to Cart', async () => {
      const getCartByPaymentIdScope = nock(`${host}/${projectKey}`)
        .get('/carts')
        .query(true) // mock the url regardless of query string
        .reply(200, noCartFoundForGivenPaymentId);

      const mockCTPaymentObj = {
        ...baseMockCTPaymentObj,
      };
      mockCTPaymentObj.resource.obj.paymentMethodInfo['method'] = 'ideal';
      mockCTPaymentObj.resource.obj['transactions'] = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: 'Charge',
          state: 'Initial',
          amount: {
            currencyCode: 'EUR',
            centAmount: 50000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);

      const { status, text } = res;
      expect(status).toBe(400);

      const parsedText = JSON.parse(text);
      const { errors } = parsedText;

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        code: 'ObjectNotFound',
        message: `Could not find Cart associated with the payment ${paymentId}.`,
        extensionExtraInfo: {
          originalStatusCode: 404,
        },
      });
      expect(getCartByPaymentIdScope.isDone()).toBeTruthy();
    });

    it('422 from mollie - pay now method', async () => {
      const getCartByPaymentIdScope = nock(`${host}/${projectKey}`)
        .get('/carts')
        .query(true) // mock the url regardless of query string
        .reply(200, cartFoundWith2LineItemsForGivenPaymentId);

      const createOrderFailsAsUnprocessableScope = nock('https://api.mollie.com/v2').post('/orders?embed=payments').reply(422, paymentMethodNotEnabledInProfile);

      const mockCTPaymentObj = {
        ...baseMockCTPaymentObj,
      };
      mockCTPaymentObj.resource.obj.paymentMethodInfo['method'] = 'ideal';
      mockCTPaymentObj.resource.obj['transactions'] = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: 'Charge',
          state: 'Initial',
          amount: {
            currencyCode: 'EUR',
            centAmount: 50000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);

      const { status, text } = res;
      expect(status).toBe(400);

      const parsedText = JSON.parse(text);
      const { errors } = parsedText;

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        code: 'SemanticError',
        message: 'The payment method is not enabled in your website profile',
        extensionExtraInfo: {
          originalStatusCode: 422,
          field: 'payment.method',
          title: 'Unprocessable Entity',
          links: {
            documentation: {
              href: 'https://docs.mollie.com/reference/v2/orders-api/create-order',
              type: 'text/html',
            },
          },
        },
      });

      expect(getCartByPaymentIdScope.isDone()).toBeTruthy();
      expect(createOrderFailsAsUnprocessableScope.isDone()).toBeTruthy();
    });

    it('422 from mollie - pay later method', async () => {
      const getCartByPaymentIdScope = nock(`${host}/${projectKey}`)
        .get('/carts')
        .query(true) // mock the url regardless of query string
        .reply(200, cartFoundWith2LineItemsForGivenPaymentId);

      const createOrderFailsAsUnprocessableScope = nock('https://api.mollie.com/v2').post('/orders?embed=payments').reply(422, amountLowerThanMinimumKlarnaSliceIt);

      const mockCTPaymentObj = {
        ...baseMockCTPaymentObj,
      };
      mockCTPaymentObj.resource.obj.paymentMethodInfo['method'] = 'klarnasliceit';
      mockCTPaymentObj.resource.obj['transactions'] = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: 'Authorization',
          state: 'Initial',
          amount: {
            currencyCode: 'EUR',
            centAmount: 50000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);

      const { status, text } = res;
      expect(status).toBe(400);

      const parsedText = JSON.parse(text);
      const { errors } = parsedText;

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        code: 'SemanticError',
        message: 'The amount is lower than the minimum',
        extensionExtraInfo: {
          originalStatusCode: 422,
          field: 'payment.amount',
          title: 'Unprocessable Entity',
          links: {
            documentation: {
              href: 'https://docs.mollie.com/reference/v2/orders-api/create-order',
              type: 'text/html',
            },
          },
        },
      });

      expect(getCartByPaymentIdScope.isDone()).toBeTruthy();
      expect(createOrderFailsAsUnprocessableScope.isDone()).toBeTruthy();
    });
  });

  describe('Happy Path', () => {
    it.skip('Charge works', async () => {
      const orderCreatedWithPayNowMethodScope = nock('https://api.mollie.com/v2').post('/orders?embed=payments').reply(201, orderCreatedWithIdeal);

      const mockCTPaymentObj = {
        ...baseMockCTPaymentObj,
      };
      mockCTPaymentObj.resource.obj.paymentMethodInfo['method'] = 'ideal';
      mockCTPaymentObj.resource.obj['transactions'] = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: 'Charge',
          state: 'Initial',
          amount: {
            currencyCode: 'EUR',
            centAmount: 50000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);

      const { status, text } = res;
      expect(status).toBe(201);

      expect(orderCreatedWithPayNowMethodScope.isDone()).toBeTruthy();
    });

    it('Authorization works', async () => {});
  });
});
