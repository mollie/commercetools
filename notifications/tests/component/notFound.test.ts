import nock from 'nock';
import request from 'supertest';
import config from '../../config/config';
import app from '../../src/app';
import { orderNotFoundResponse, paymentNotFoundResponse } from './mockResponses/mollieData/notFound.data';
import { mockOrderResponse } from './mockResponses/mollieData/order.data';
import { mockPaymentResponse } from './mockResponses/mollieData/payment.data';
import { paymentNotFound } from './mockResponses/commercetoolsData/notFound.data';
import Logger from '../../src/logger/logger';

describe('Webhook triggered with non-existent mollie ID as payload', () => {
  const mockLogDebug = jest.fn();
  const mockLogError = jest.fn();

  beforeEach(() => {
    Logger.debug = mockLogDebug;
    Logger.error = mockLogError;
  });

  afterEach(() => {
    nock.cleanAll();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should return 200 when called with non existent order id', async () => {
    const mockBody = { id: 'ord_12345' };
    const orderNotFoundScope = nock('https://api.mollie.com/v2')
      .get(/orders\/ord_12345\?embed=payments*/)
      .reply(404, orderNotFoundResponse);

    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(200);
    expect(mockLogDebug).toHaveBeenLastCalledWith('Error in getOrderDetailsById');
    expect(orderNotFoundScope.isDone()).toBeTruthy();
  });

  it('should return 200 when called with non existent payment id', async () => {
    const mockBody = { id: 'tr_12345' };
    const paymentNotFoundScope = nock('https://api.mollie.com/v2')
      .get(/payments\/tr_12345\?embed=refunds*/)
      .reply(404, paymentNotFoundResponse);

    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(200);
    expect(mockLogDebug).toHaveBeenLastCalledWith('Error in getPaymentDetailsById');
    expect(paymentNotFoundScope.isDone()).toBeTruthy();
  });

  it('should return 200 when called with invalid id', async () => {
    const mockBody = { id: 'pr_12345' };

    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(200);
    expect(mockLogError).toHaveBeenLastCalledWith('ID pr_12345 is invalid');
  });
});

describe('Commercetools Payment object not found', () => {
  const {
    commercetools: { host, projectKey, authUrl },
  } = config;
  const mockLogDebug = jest.fn();
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

    Logger.debug = mockLogDebug;
    Logger.error = mockLogError;
  });

  afterEach(() => {
    nock.cleanAll();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should return 200 and log NotFound error when order webhook is triggered and the CT Payment is not found', async () => {
    const mockBody = { id: 'ord_12345' };
    const mollieGetOrderScope = nock('https://api.mollie.com/v2')
      .get(/orders\/ord_12345\?embed=payments*/)
      .reply(200, mockOrderResponse);

    const ctPaymentNotFoundScope = nock(`${host}/${projectKey}`)
      .get(uri => uri.includes('key=ord_12345'))
      .reply(404, paymentNotFound);

    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(400);
    expect(mockLogDebug).toHaveBeenLastCalledWith('Error in getPaymentByKey');
    expect(mollieGetOrderScope.isDone()).toBeTruthy();
    expect(ctPaymentNotFoundScope.isDone()).toBeTruthy();
  });

  it('should return 200 and log NotFound error when payment webhook is triggered and the CT Payment is not found', async () => {
    const mockBody = { id: 'tr_WDqYK6vllg' };
    const mollieGetPaymentScope = nock('https://api.mollie.com/v2')
      .get(/payments\/tr_WDqYK6vllg\?embed=refunds*/)
      .reply(200, mockPaymentResponse);

    const ctPaymentNotFoundScope = nock(`${host}/${projectKey}`)
      .get(uri => uri.includes('key=ord_12345'))
      .reply(404, paymentNotFound);
    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(400);
    expect(mockLogDebug).toHaveBeenLastCalledWith('Error in getPaymentByKey');
    expect(mollieGetPaymentScope.isDone()).toBeTruthy();
    expect(ctPaymentNotFoundScope.isDone()).toBeTruthy();
  });
});
