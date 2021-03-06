import nock from 'nock';
import request from 'supertest';
import app from '../../src/app';
import { paymentMethodsAvailableResponse, noPaymentMethodsAvailableResponse } from './mockResponses/mollieData/listPaymentMethods.data';
import Logger from '../../src/logger/logger';

describe('List Payment Methods', () => {
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

  it('should return 200 and update action containing the count and methods available on mollie', async () => {
    // Set up nock

    const availablePaymentMethodsScope = nock('https://api.mollie.com/v2')
      .get(/methods*/)
      .reply(200, paymentMethodsAvailableResponse);

    // Call API extension & trigger payment methods request
    const res = await request(app).post('/').send(mockCTPaymentObj);

    const { status, body } = res;
    expect(status).toBe(200);

    // Check the update action
    const { actions } = body;
    expect(actions).toHaveLength(1);

    const { name, value: stringifiedValue } = actions.find((action: any) => action.action === 'setCustomField');
    expect(name).toBe('paymentMethodsResponse');

    const value = JSON.parse(stringifiedValue);

    expect(value.count).toBe(2);
    expect(value.methods).toHaveLength(2);
    expect(availablePaymentMethodsScope.isDone()).toBeTruthy();
  });

  it('should return 200 and update action containing "no methods found" if there are no available payment methods on mollie', async () => {
    // Set up nock
    const noAvailablePaymentMethodsScope = nock('https://api.mollie.com/v2')
      .get(/methods*/)
      .reply(200, noPaymentMethodsAvailableResponse);

    // Call API extension & trigger payment methods request
    const res = await request(app).post('/').send(mockCTPaymentObj);

    const { status, body } = res;
    expect(status).toBe(200);

    // Check the update action
    const { actions } = body;
    expect(actions).toHaveLength(1);

    const { name, value: stringifiedValue } = actions.find((action: any) => action.action === 'setCustomField');
    expect(name).toBe('paymentMethodsResponse');

    const value = JSON.parse(stringifiedValue);
    expect(value).toEqual({
      count: 0,
      methods: 'NO_AVAILABLE_PAYMENT_METHODS',
    });
    expect(noAvailablePaymentMethodsScope.isDone()).toBeTruthy();
  });

  it('Should return status 400 and formatted error if passed an incorrectly formatted value for paymentMethodsRequest', async () => {
    // overwrite logger to prevent unneccesary warnings being printed to the console when testing
    Logger.error = jest.fn();

    const wrongFormatMockCTPaymentObj = {
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
              paymentMethodsRequest: '{"badlyformatted_json":}',
            },
          },
        },
      },
    };
    const res = await request(app).post('/').send(wrongFormatMockCTPaymentObj);
    const { status, body } = res;
    expect(status).toBe(400);

    const { errors } = body;
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      code: 'InvalidInput',
      message: 'Unexpected token } in JSON at position 23',
      extensionExtraInfo: {
        field: 'custom.fields.paymentMethodsRequest',
        originalStatusCode: 400,
        title: 'Parsing error',
      },
    });
  });
});
