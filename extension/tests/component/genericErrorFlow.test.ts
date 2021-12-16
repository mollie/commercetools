import nock from 'nock';
import request from 'supertest';
import app from '../../src/app';
import { genericMollieErrorResponse } from './mockResponses/mollieData/generalErrorResponses.data';
import Logger from '../../src/logger/logger';

describe('General Error Flow - Mollie API returning 5xx', () => {
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

  beforeAll(() => {
    // overwrite logger to prevent unneccesary warnings being printed to the console when testing
    Logger.error = jest.fn();
  });
  afterEach(() => {
    nock.cleanAll();
  });

  it('Should be able to handle a generic 500 error from mollie', async () => {
    const genericMollieServerErrorScope = nock('https://api.mollie.com/v2')
      .get(/methods*/)
      .reply(500, genericMollieErrorResponse);

    const res = await request(app).post('/').send(mockCTPaymentObj);
    const { status, text } = res;
    expect(status).toBe(400);

    // This will change when we move away from using formatErrorResponse
    // to formatExtensionErrorResponse when error doesn't orginate from API
    const parsedErrors = JSON.parse(text);
    const { errors } = parsedErrors;
    expect(errors).toHaveLength(1);
    expect(genericMollieServerErrorScope.isDone()).toBeTruthy();
  });
});
