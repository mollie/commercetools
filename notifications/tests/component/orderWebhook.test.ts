import nock from 'nock';
import request from 'supertest';
import app from '../../src/app';
import config from '../../config/config';
import { mockPaidOrder } from './mockResponses/mollieData/order.data';
import { ctPaymentResponse } from './mockResponses/commercetoolsData/payment.data';
import Logger from '../../src/logger/logger';

describe('Webhook triggered with Mollie order ID as payload', () => {
  const {
    commercetools: { host, projectKey, authUrl },
  } = config;
  const mockLogError = jest.fn();
  let authTokenScope: any;

  beforeEach(() => {
    authTokenScope = nock(`${authUrl}`).persist().post('/oauth/token').reply(200, {
      access_token: 'vkFuQ6oTwj8_Ye4eiRSsqMeqLYNeQRJi',
      expires_in: 172800, // seconds (2 days)
      scope: 'manage_project:{projectKey}',
      token_type: 'Bearer',
    });
    Logger.error = mockLogError;
  });

  afterEach(() => {
    nock.cleanAll();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should return 200 when called with existing order id', async () => {
    const mockBody = { id: 'ord_12345' };
    const expectedUpdateBody = {
      version: 25,
      actions: [
        {
          action: 'changeTransactionState',
          transactionId: '2020335e-1ea2-4d49-b45b-14a078f589a6',
          state: 'Success',
        },
        {
          action: 'addTransaction',
          transaction: {
            type: 'Charge',
            amount: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 3104,
              fractionDigits: 2,
            },
            timestamp: '2021-12-23T09:18:26+00:00',
            interactionId: 'tr_PT2VFFtKEu',
            state: 'Failure',
          },
        },
        { action: 'setStatusInterfaceText', interfaceText: 'paid' },
      ],
    };
    const mollieOrderScope = nock('https://api.mollie.com/v2')
      .get(uri => uri.includes('ord_12345'))
      .reply(200, mockPaidOrder);
    const ctGetPaymentScope = nock(`${host}/${projectKey}`)
      .get(uri => uri.includes('key=ord_12345'))
      .reply(200, ctPaymentResponse);
    const ctUpdatePaymentScope = nock(`${host}/${projectKey}`)
      .post(uri => uri.includes('key=ord_12345'), expectedUpdateBody)
      .reply(200, {});

    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(200);
    expect(mollieOrderScope.isDone()).toBe(true);
    expect(ctGetPaymentScope.isDone()).toBe(true);
    expect(ctUpdatePaymentScope.isDone()).toBe(true);
  });
});
