import nock from 'nock';
import request from 'supertest';
import app from '../../src/app';
import { paymentMethodsAvailableResponse } from './mockResponses/mollieData/listPaymentMethods.data';

describe('Correlation Id headers', () => {
  const mockCTPaymentObj = {
    resource: {
      obj: {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
        },
        amountPlanned: {
          currencyCode: 'EUR',
          centAmount: 50000,
        },
        custom: {
          fields: {
            paymentMethodsRequest: '{}',
          },
        },
      },
    },
  };

  afterEach(() => {
    nock.cleanAll();
  });

  it('Should generate correlation id header in case it is not present', async () => {
    const availablePaymentMethodsScope = nock('https://api.mollie.com/v2')
      .get(/methods*/)
      .reply(200, paymentMethodsAvailableResponse);

    // Call API extension & trigger payment methods request
    const res = await request(app).post('/').send(mockCTPaymentObj);

    const { status, headers } = res;
    expect(status).toBe(200);
    expect(headers['x-correlation-id'].startsWith('mollie-integration-')).toBe(true);

    // Check the update action
  });

  it('Should return original correlation id header in case it is present', async () => {
    const testCorrelationId = 'test-correlation-id'
    const availablePaymentMethodsScope = nock('https://api.mollie.com/v2')
      .get(/methods*/)
      .reply(200, paymentMethodsAvailableResponse);

    // Call API extension & trigger payment methods request
    const res = await request(app)
      .post('/')
      .set('x-correlation-id', testCorrelationId)
      .send(mockCTPaymentObj);

    const { status, headers } = res;
    expect(status).toBe(200);
    expect(headers['x-correlation-id']).toBe(testCorrelationId);

    // Check the update action
  });
});
