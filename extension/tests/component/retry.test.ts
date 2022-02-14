import nock from 'nock';
import request from 'supertest';
import app from '../../src/app';
import config from '../../config/config';
import Logger from '../../src/logger/logger';

import { cartWithLineItems } from './mockResponses/commercetoolsData/cartResponses.data';
import { orderCreatedWithTwoLinesUsingIdeal } from './mockResponses/mollieData/createOrder.data';

describe('Commercetools tries multiple times on 503 or network errors', () => {
  const {
    commercetools: { host, projectKey, authUrl },
  } = config;
  const mockLogError = jest.fn();

  const paymentId = 'd75d0b1d-64c5-4c8f-86f6-b9510332e743';
  const mockCTPaymentObj: any = {
    resource: {
      obj: {
        id: paymentId,
        paymentMethodInfo: {
          paymentInterface: 'mollie',
          method: 'ideal',
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
        transactions: [
          {
            id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
            type: 'Charge',
            state: 'Initial',
            amount: {
              currencyCode: 'EUR',
              centAmount: 90000,
            },
          },
        ],
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
    Logger.error = mockLogError;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    authTokenScope.persist(false);
  });

  it('Should retry when call to commercetools responds with 503', async () => {
    const getCartByPaymentIdScope = nock(`${host}/${projectKey}`)
      .get('/carts')
      .query(true) // mock the url regardless of query string
      .reply(503)
      .get('/carts')
      .query(true) // mock the url regardless of query string
      .reply(200, cartWithLineItems);
    const orderCreatedWithPayNowMethodScope = nock('https://api.mollie.com/v2').post('/orders?embed=payments').reply(201, orderCreatedWithTwoLinesUsingIdeal);

    const res = await request(app).post('/').send(mockCTPaymentObj);
    const { status } = res;
    expect(status).toBe(201);
    expect(getCartByPaymentIdScope.isDone()).toBeTruthy();
    expect(orderCreatedWithPayNowMethodScope.isDone()).toBeTruthy();
  });
});
