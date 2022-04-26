import nock from 'nock';
import request from 'supertest';
import config from '../../config/config';
import app from '../../src/app';
import { mockPaidOrder } from './mockResponses/mollieData/order.data';
import { ctPaymentResponse } from './mockResponses/commercetoolsData/payment.data';
import Logger from '../../src/logger/logger';

describe('Commercetools tries multiple times on 503 or network errors', () => {
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

  it('should retry when call to commercetools responds with 503', async () => {
    const mockBody = 'id=ord_12345';
    const mollieOrderScope = nock('https://api.mollie.com/v2')
      .get(/orders\/ord_12345\?embed=payments*/)
      .reply(200, mockPaidOrder);
    const ctGetPaymentScope = nock(`${host}/${projectKey}`)
      .get(uri => uri.includes('key=ord_12345'))
      .reply(503)
      .get(uri => uri.includes('key=ord_12345'))
      .reply(503)
      .get(uri => uri.includes('key=ord_12345'))
      .reply(200, ctPaymentResponse);
    const ctUpdatePaymentScope = nock(`${host}/${projectKey}`)
      .post(uri => uri.includes('key=ord_12345'))
      .reply(200, {});

    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(200);
    expect(mollieOrderScope.isDone()).toBeTruthy();
    expect(ctGetPaymentScope.isDone()).toBeTruthy();
    expect(ctUpdatePaymentScope.isDone()).toBeTruthy();
  });
});
