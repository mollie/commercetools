import nock from 'nock';
import request from 'supertest';
import app from '../../src/app';
import { paymentMethodsAvailableResponse, noPaymentMethodsAvailableResponse, genericMollieErrorResponse } from './mockResponses/mollieData/listpaymentmethods.data';

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

    const { status, text } = res;
    expect(status).toBe(200);

    // Parse and check the update action
    const parsedActions = JSON.parse(text);
    const { actions } = parsedActions;
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

    const { status, text } = res;
    expect(status).toBe(200);

    // Parse and check the update action
    const parsedActions = JSON.parse(text);
    const { actions } = parsedActions;
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

  it('Should be able to handle a generic 500 error from mollie', async () => {
    const genericMollieServerErrorScope = nock('https://api.mollie.com/v2')
      .get(/methods*/)
      .reply(500, genericMollieErrorResponse);

    const res = await request(app).post('/').send(mockCTPaymentObj);
    const { status, text } = res;
    expect(status).toBe(400);

    const errors = JSON.parse(text).errors;
    expect(errors).toHaveLength(1);
    expect(errors[0].extensionExtraInfo.mollieStatusCode).toBe(500);

    expect(genericMollieServerErrorScope.isDone()).toBeTruthy();
  });
});
