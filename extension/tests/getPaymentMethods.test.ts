import { Request } from 'express';
import { mocked } from 'ts-jest/utils';
import getPaymentMethods from '../src/requestHandlers/getPaymentMethods';
import { createDateNowString } from '../src/utils';

jest.mock('../src/utils');

describe('getPaymentMethods unit tests', () => {
  beforeAll(() => {
    console.warn = jest.fn();
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('Should call mollie mollieClient.methods.all', async () => {
    const mockedRequest = {
      body: { custom: { fields: { paymentMethodsRequest: {} } } },
    } as Request;
    const mollieClient = {
      methods: { all: jest.fn().mockResolvedValueOnce([]) },
    } as any;
    await getPaymentMethods(mockedRequest, mollieClient);
    expect(mollieClient.methods.all).toBeCalled();
  });

  it('Should return status and two update actions for Commerce Tools', async () => {
    const mockedPaymentMethodsRequest = {
      locale: 'en_US',
      resource: 'orders',
      billingCountry: 'NL',
      includeWallets: 'applepay',
      orderLineCategories: 'eco,meal',
    };
    const mockedRequest = {
      body: {
        custom: {
          fields: { paymentMethodsRequest: mockedPaymentMethodsRequest },
        },
      },
    } as Request;

    const mockedResponse = [
      {
        resource: 'method',
        id: 'ideal',
        description: 'iDEAL',
        minimumAmount: { value: '0.01', currency: 'EUR' },
        maximumAmount: { value: '50000.00', currency: 'EUR' },
        image: {
          size1x: 'https://www.mollie.com/external/icons/payment-methods/ideal.png',
          size2x: 'https://www.mollie.com/external/icons/payment-methods/ideal%402x.png',
          svg: 'https://www.mollie.com/external/icons/payment-methods/ideal.svg',
        },
        status: 'pending-boarding',
        _links: {},
      },
    ];

    const mollieClient = {
      methods: { all: jest.fn().mockResolvedValueOnce(mockedResponse) },
    } as any;
    const { actions, status } = await getPaymentMethods(mockedRequest, mollieClient);

    expect(status).toBe(200);
    expect(actions).toHaveLength(2);
    actions?.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });

  it('Should return NO_PAYMENT_METHODS when methods returned are empty', async () => {
    const mockedPaymentMethodsRequest = {
      locale: 'en_US',
      resource: 'orders',
      billingCountry: 'NL',
      includeWallets: 'applepay',
      orderLineCategories: 'eco,meal',
    };
    const mockedRequest = {
      body: {
        custom: {
          fields: { paymentMethodsRequest: mockedPaymentMethodsRequest },
        },
      },
    } as Request;
    const mockedResponse = 'NO_AVAILABLE_PAYMENT_METHODS';
    const mollieClient = {
      methods: { all: jest.fn().mockResolvedValueOnce(mockedResponse) },
    } as any;
    const { actions, status } = await getPaymentMethods(mockedRequest, mollieClient);

    expect(status).toBe(200);
    expect(actions).toHaveLength(2);
    actions?.forEach(action => {
      expect(action).toMatchSnapshot();
    });

    const paymentMethodsResponseCTCustomField = actions?.find(a => a.action === 'setCustomField');
    expect(paymentMethodsResponseCTCustomField?.value).toEqual(JSON.stringify('NO_AVAILABLE_PAYMENT_METHODS'));
  });

  it('Should not fail without request body', async () => {
    const mockedRequest = {} as Request;
    const mollieClient = {
      methods: { all: jest.fn().mockResolvedValueOnce([]) },
    } as any;
    const { actions, status } = await getPaymentMethods(mockedRequest, mollieClient);

    expect(status).toBe(200);
    expect(actions).toHaveLength(2);
  });

  it('Should return error if mollieClient call fails', async () => {
    const mockedError = new Error('Test error');
    const mockedRequest = {} as Request;
    const mollieClient = {
      methods: { all: jest.fn().mockRejectedValue(mockedError) },
    } as any;
    const { errors, status } = await getPaymentMethods(mockedRequest, mollieClient);
    expect(status).toBe(400);
    expect(errors).toBeInstanceOf(Array);
  });
});
