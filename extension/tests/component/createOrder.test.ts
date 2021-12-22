import nock from 'nock';
import request from 'supertest';
import { v4 as uuid } from 'uuid';
import { mocked } from 'ts-jest/utils';
import app from '../../src/app';
import config from '../../config/config';
import Logger from '../../src/logger/logger';

import {
  noCartFoundForGivenPaymentId,
  cartFoundWith2LineItemsForGivenPaymentId,
  cartFoundWith2LineItemsAndOneCustomLineItemForGivenPaymentId,
} from './mockResponses/commercetoolsData/cartResponses.data';
import {
  paymentMethodNotEnabledInProfile,
  amountLowerThanMinimumKlarnaSliceIt,
  orderCreatedWithTwoLinesUsingIdeal,
  orderCreatedWithTwoLineItemsUsingKlarna,
  orderCreatedIncludingDiscountLineUsingIdeal,
} from './mockResponses/mollieData/createOrder.data';

jest.mock('uuid');

describe('Create Order', () => {
  const {
    commercetools: { host, projectKey, authUrl },
  } = config;
  const mockLogDebug = jest.fn();
  const mockLogError = jest.fn();

  const paymentId = 'd75d0b1d-64c5-4c8f-86f6-b9510332e743';
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
    afterEach(() => {
      nock.cleanAll();
    });

    it('200 - Order created successfully using pay now method (iDEAL)', async () => {
      const getCartByPaymentIdScope = nock(`${host}/${projectKey}`)
        .get('/carts')
        .query(true) // mock the url regardless of query string
        .reply(200, cartFoundWith2LineItemsForGivenPaymentId);
      const orderCreatedWithPayNowMethodScope = nock('https://api.mollie.com/v2').post('/orders?embed=payments').reply(201, orderCreatedWithTwoLinesUsingIdeal);

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
            centAmount: 90000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, text } = res;
      expect(status).toBe(201);

      const parsedActions = JSON.parse(text);
      const { actions } = parsedActions;
      expect(actions).toHaveLength(6);

      // Ensure the interface interaction contains the checkout url
      const interfaceInteractionAction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
      expect(JSON.parse(interfaceInteractionAction.fields.response)).toEqual({
        mollieOrderId: 'ord_8xnw8a',
        checkoutUrl: 'https://www.mollie.com/checkout/order/8xnw8a',
        transactionId: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
      });
      // Snapshot all update actions
      actions.forEach((action: any) => {
        expect(action).toMatchSnapshot();
      });
      expect(getCartByPaymentIdScope.isDone()).toBeTruthy();
      expect(orderCreatedWithPayNowMethodScope.isDone()).toBeTruthy();
    });

    it('200 - Order created successfully using pay later method (Klarnapaylater)', async () => {
      const getCartByPaymentIdScope = nock(`${host}/${projectKey}`)
        .get('/carts')
        .query(true) // mock the url regardless of query string
        .reply(200, cartFoundWith2LineItemsForGivenPaymentId);
      const orderCreatedWithPayLaterMethodScope = nock('https://api.mollie.com/v2').post('/orders?embed=payments').reply(201, orderCreatedWithTwoLineItemsUsingKlarna);
      const mockCTPaymentObj = {
        ...baseMockCTPaymentObj,
      };
      mockCTPaymentObj.resource.obj.paymentMethodInfo['method'] = 'klarnapaylater';
      mockCTPaymentObj.resource.obj['transactions'] = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: 'Authorization',
          state: 'Initial',
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, text } = res;
      expect(status).toBe(201);

      const parsedActions = JSON.parse(text);
      const { actions } = parsedActions;
      expect(actions).toHaveLength(6);

      // Ensure the interface interaction contains the checkout url
      const interfaceInteractionAction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
      expect(JSON.parse(interfaceInteractionAction.fields.response)).toEqual({
        mollieOrderId: 'ord_l2idwq',
        checkoutUrl: 'https://www.mollie.com/checkout/order/l2idwq',
        transactionId: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
      });
      // Snapshot all update actions
      actions.forEach((action: any) => {
        expect(action).toMatchSnapshot();
      });

      expect(getCartByPaymentIdScope.isDone()).toBeTruthy();
      expect(orderCreatedWithPayLaterMethodScope.isDone()).toBeTruthy();
    });

    it('200 - Order created from cart with Line Items and Custom Line Items', async () => {
      const getCartByPaymentIdScope = nock(`${host}/${projectKey}`)
        .get('/carts')
        .query(true) // mock the url regardless of query string
        .reply(200, cartFoundWith2LineItemsAndOneCustomLineItemForGivenPaymentId);
      const orderCreatedWithDiscountLineScope = nock('https://api.mollie.com/v2').post('/orders?embed=payments').reply(201, orderCreatedIncludingDiscountLineUsingIdeal);

      const mockCTPaymentObj = {
        ...baseMockCTPaymentObj,
      };
      mockCTPaymentObj.resource.obj.id = '990d9419-62c2-44e5-91d4-8cb9e5cc6518';
      mockCTPaymentObj.resource.obj.paymentMethodInfo['method'] = 'ideal';
      mockCTPaymentObj.resource.obj['transactions'] = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: 'Charge',
          state: 'Initial',
          amount: {
            currencyCode: 'EUR',
            centAmount: 88500,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, text } = res;
      expect(status).toBe(200);

      const parsedActions = JSON.parse(text);
      const { actions } = parsedActions;
      expect(actions).toHaveLength(6);

      // Ensure the interface interaction contains the checkout url
      const interfaceInteractionAction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
      expect(JSON.parse(interfaceInteractionAction.fields.response)).toEqual({
        mollieOrderId: 'ord_ca1j7q',
        checkoutUrl: 'https://www.mollie.com/checkout/order/ca1j7q',
        transactionId: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
      });
      // Snapshot all update actions
      actions.forEach((action: any) => {
        expect(action).toMatchSnapshot();
      });
      expect(getCartByPaymentIdScope.isDone()).toBeTruthy();
      expect(orderCreatedWithDiscountLineScope.isDone()).toBeTruthy();
    });
  });
});
