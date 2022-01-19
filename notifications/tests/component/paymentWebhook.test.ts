import nock from 'nock';
import request from 'supertest';
import { omit } from 'lodash';
import app from '../../src/app';
import config from '../../config/config';
import { mockPaidPayment } from './mockResponses/mollieData/payment.data';
import { ctPaymentResponse } from './mockResponses/commercetoolsData/payment.data';
import Logger from '../../src/logger/logger';

describe('Webhook triggered with Mollie payment ID as payload', () => {
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

  it('should update the commercetools transaction state when transaction state is different than Mollie payment status', async () => {
    const mockBody = { id: 'tr_ncaPcAhuUV' };
    const mockPaidPaymentNoRefund = omit(mockPaidPayment, '_embedded');
    const expectedUpdateBody = {
      version: 25,
      actions: [
        {
          action: 'changeTransactionState',
          transactionId: '2020335e-1ea2-4d49-b45b-14a078f589a6',
          state: 'Success',
        },
      ],
    };
    const molliePaymentScope = nock('https://api.mollie.com/v2')
      .get(uri => uri.includes('payments/tr_ncaPcAhuUV'))
      .reply(200, mockPaidPaymentNoRefund);
    const ctGetPaymentScope = nock(`${host}/${projectKey}`)
      .get(uri => uri.includes('key=ord_12345'))
      .reply(200, ctPaymentResponse);
    const ctUpdatePaymentScope = nock(`${host}/${projectKey}`)
      .post(uri => uri.includes('key=ord_12345'), expectedUpdateBody)
      .reply(200, {});

    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(200);
    expect(molliePaymentScope.isDone()).toBe(true);
    expect(ctGetPaymentScope.isDone()).toBe(true);
    expect(ctUpdatePaymentScope.isDone()).toBe(true);
  });
  it('should add the commercetools transaction when none of existing transactions correspond to Mollie payment', async () => {
    const newId = 'tr_3nPcU3Epcj';
    const mockBody = { id: newId };
    const mockPaidPaymentNoRefund = omit(mockPaidPayment, '_embedded');
    mockPaidPaymentNoRefund.id = newId;
    const expectedUpdateBody = {
      version: 25,
      actions: [
        {
          action: 'addTransaction',
          transaction: {
            amount: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 1000,
              fractionDigits: 2,
            },
            state: 'Success',
            type: 'Charge',
            interactionId: newId,
          },
        },
      ],
    };
    const molliePaymentScope = nock('https://api.mollie.com/v2')
      .get(uri => uri.includes(`payments/${newId}?embed=refunds`))
      .reply(200, mockPaidPaymentNoRefund);
    const ctGetPaymentScope = nock(`${host}/${projectKey}`)
      .get(uri => uri.includes('key=ord_12345'))
      .reply(200, ctPaymentResponse);
    const ctUpdatePaymentScope = nock(`${host}/${projectKey}`)
      .post(uri => uri.includes('key=ord_12345'), expectedUpdateBody)
      .reply(200, {});

    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(200);
    expect(molliePaymentScope.isDone()).toBe(true);
    expect(ctGetPaymentScope.isDone()).toBe(true);
    expect(ctUpdatePaymentScope.isDone()).toBe(true);
  });
  it('should update refund status', async () => {
    const mockBody = { id: 'tr_ncaPcAhuUV' };
    ctPaymentResponse.transactions = [
      {
        id: '2020335e-1ea2-4d49-b45b-14a078f589a6',
        timestamp: '2022-01-03T15:49:11.000Z',
        type: 'Authorization',
        amount: {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 1000,
          fractionDigits: 2,
        },
        interactionId: 'tr_ncaPcAhuUV',
        state: 'Success',
      },
      {
        id: '2020335e-1ea2-4d49-b45b-14a078f589a6',
        timestamp: '2022-01-03T15:49:11.000Z',
        type: 'Refund',
        amount: {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 1000,
          fractionDigits: 2,
        },
        interactionId: 'tr_ncaPcAhuUV',
        state: 'Initial',
      },
    ];
    const expectedUpdateBody = {
      version: 25,
      actions: [
        {
          action: 'addTransaction',
          transaction: {
            type: 'Refund',
            amount: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 142,
              fractionDigits: 2,
            },
            interactionId: 're_8eP2Kzt9G9',
            state: 'Success',
          },
        },
      ],
    };
    const molliePaymentScope = nock('https://api.mollie.com/v2')
      .get(uri => uri.includes('payments/tr_ncaPcAhuUV'))
      .reply(200, mockPaidPayment);
    const ctGetPaymentScope = nock(`${host}/${projectKey}`)
      .get(uri => uri.includes('key=ord_12345'))
      .reply(200, ctPaymentResponse);
    const ctUpdatePaymentScope = nock(`${host}/${projectKey}`)
      .post(uri => uri.includes('key=ord_12345'), expectedUpdateBody)
      .reply(200, {});

    const { status } = await request(app).post('/').send(mockBody);
    expect(status).toBe(200);
    expect(molliePaymentScope.isDone()).toBe(true);
    expect(ctGetPaymentScope.isDone()).toBe(true);
    expect(ctUpdatePaymentScope.isDone()).toBe(true);
  });
});
