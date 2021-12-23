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
    const { status, body } = res;
    expect(status).toBe(400);

    const { errors } = body;
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      code: 'General',
      message: 'Received an error without a message',
      extensionExtraInfo: {
        title: 'Internal Server Error',
        originalStatusCode: 500,
        links: {
          documentation: {
            href: 'https://docs.mollie.com/overview/handling-errors',
            type: 'text/html',
          },
        },
      },
    });
    expect(genericMollieServerErrorScope.isDone()).toBeTruthy();
  });
});
