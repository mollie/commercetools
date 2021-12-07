import { Request } from 'express';
import { mocked } from 'ts-jest/utils';
import getPaymentMethods from '../../../src/requestHandlers/getPaymentMethods';
import { convertCTToMollieAmountValue, createDateNowString } from '../../../src/utils';
import Logger from '../../../src/logger/logger';
import { MollieClient } from '@mollie/api-client';
import MethodsResource from '@mollie/api-client/dist/types/src/resources/methods/MethodsResource';

jest.mock('../../../src/utils');

describe('GetPaymentMethods', () => {
  const mockLogError = jest.fn();
  beforeAll(() => {
    Logger.error = mockLogError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('Should call mollie mollieClient.methods.list', async () => {
    const mockedRequest = {
      custom: { fields: { paymentMethodsRequest: {} } },
    };
    const mollieClient = {
      methods: { list: jest.fn().mockResolvedValueOnce([]) },
    } as any;
    await getPaymentMethods(mockedRequest, mollieClient);
    expect(mollieClient.methods.list).toBeCalled();
  });

  it('Should return status and one update action for commercetools', async () => {
    const mockedPaymentMethodsRequest = '{"locale":"en_US","resource":"orders","billingCountry":"NL","includeWallets":"applepay","orderLineCategories":"eco,meal"}';
    const mockedRequest = {
      custom: {
        fields: { paymentMethodsRequest: mockedPaymentMethodsRequest },
      },
    };
    const mockedMethodsResponse = [
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
      },
      {
        resource: 'method',
        id: 'paypal',
        description: 'PayPal',
        minimumAmount: { value: '0.01', currency: 'EUR' },
        maximumAmount: null,
        image: {
          size1x: 'https://www.mollie.com/external/icons/payment-methods/paypal.png',
          size2x: 'https://www.mollie.com/external/icons/payment-methods/paypal%402x.png',
          svg: 'https://www.mollie.com/external/icons/payment-methods/paypal.svg',
        },
      },
    ] as any;
    mockedMethodsResponse.count = 2;
    const mollieClient = {
      methods: { list: jest.fn().mockResolvedValueOnce(mockedMethodsResponse) },
    } as any;
    const { actions, status } = await getPaymentMethods(mockedRequest, mollieClient);

    expect(status).toBe(200);
    expect(actions).toHaveLength(1);
    actions?.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });

  it('Should return NO_PAYMENT_METHODS when methods returned are empty', async () => {
    const mockedPaymentMethodsRequest = '{"locale":"en_US","resource":"orders","billingCountry":"NL","includeWallets":"applepay","orderLineCategories":"eco,meal"}';
    const mockedRequest = {
      custom: {
        fields: { paymentMethodsRequest: mockedPaymentMethodsRequest },
      },
    };
    const mollieClient = {
      methods: {
        list: jest.fn().mockResolvedValueOnce([
          {
            count: 0,
            links: {
              documentation: {
                href: 'https://docs.mollie.com/reference/v2/methods-api/list-methods',
                type: 'text/html',
              },
              self: {
                href: 'https://api.mollie.com/v2/methods',
                type: 'application/hal+json',
              },
            },
            nextPage: undefined,
            nextPageCursor: undefined,
            previousPage: undefined,
            previousPageCursor: undefined,
          },
        ]),
      },
    } as any;
    const { actions, status } = await getPaymentMethods(mockedRequest, mollieClient);

    expect(status).toBe(200);
    expect(actions).toHaveLength(1);
    actions?.forEach(action => {
      expect(action).toMatchSnapshot();
    });

    const paymentMethodsResponseCTCustomField = actions?.find(a => a.action === 'setCustomField');
    expect(paymentMethodsResponseCTCustomField?.value).toEqual(JSON.stringify({ count: 0, methods: 'NO_AVAILABLE_PAYMENT_METHODS' }));
  });

  it('Should return error if mollieClient call fails', async () => {
    const mockedError = new Error('Test error');
    const mockedRequest = {} as Request;
    const mollieClient = {
      methods: { list: jest.fn().mockRejectedValue(mockedError) },
    } as any;
    const { errors, status } = await getPaymentMethods(mockedRequest, mollieClient);
    expect(status).toBe(400);
    expect(errors).toBeInstanceOf(Array);
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});

describe('Get Payment Methods - extractMethodListParameters', () => {
  const mockMollieClient = {} as MollieClient;
  const mockMethodsResource = {} as MethodsResource;
  mockMollieClient.methods = mockMethodsResource;
  const mockMethodsResponse: any = [{ method: 'creditcard' }];
  mockMethodsResponse.count = 1;
  const mockList = jest.fn().mockResolvedValue(() => mockMethodsResponse);

  beforeEach(() => {
    mockMethodsResource.list = mockList;
    mocked(convertCTToMollieAmountValue).mockReturnValue('11.00');
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should return empty object if the amount is not present', async () => {
    const expectedMockListOptions = {};

    const ctObj = {
      custom: {
        fields: {
          paymentMethodsRequest: '{}',
        },
      },
    };

    await getPaymentMethods(ctObj, mockMollieClient);

    expect(mockList).toHaveBeenLastCalledWith(expectedMockListOptions);
  });

  it('should handle and call with correct sequence type, wallets, issuers and pricing', async () => {
    const expectedMockListOptions = {
      amount: {
        currency: 'EUR',
        value: '11.00',
      },
      resource: 'orders',
      include: 'pricing',
      includeWallets: true,
      sequenceType: 'first',
    };

    const ctObj = {
      amountPlanned: {
        currencyCode: 'EUR',
        centAmount: 1100,
      },
      custom: {
        fields: {
          paymentMethodsRequest: '{"issuers":false,"pricing":true,"includeWallets":true,"sequenceType":"first"}',
        },
      },
    };

    await getPaymentMethods(ctObj, mockMollieClient);

    expect(mockList).toHaveBeenLastCalledWith(expectedMockListOptions);
  });

  it('Should call mollie with correct locale', async () => {
    const expectedMockListOptions = {
      amount: {
        currency: 'USD',
        value: '11.00',
      },
      resource: 'orders',
      locale: 'en_US',
    };

    const ctObj = {
      amountPlanned: {
        currencyCode: 'USD',
        centAmount: 1100,
      },
      custom: {
        fields: {
          paymentMethodsRequest: '{"locale":"en_US"}',
        },
      },
    };

    await getPaymentMethods(ctObj, mockMollieClient);

    expect(mockList).toHaveBeenLastCalledWith(expectedMockListOptions);
  });

  it('Should call mollie with properly formatted custom fields including billing country and orderline categories', async () => {
    const expectedMockListOptions = {
      amount: {
        currency: 'EUR',
        value: '11.00',
      },
      resource: 'orders',
      locale: 'nl_NL',
      billingCountry: 'NL',
      orderLineCategories: 'eco,meal',
      include: 'issuers,',
    };

    const ctObj = {
      amountPlanned: {
        currencyCode: 'EUR',
        centAmount: 1100,
      },
      custom: {
        fields: {
          paymentMethodsRequest: '{"locale":"nl_NL","billingCountry":"NL","orderLineCategories":"eco,meal","issuers":true,"pricing":false}',
        },
      },
    };

    await getPaymentMethods(ctObj, mockMollieClient);

    expect(mockList).toHaveBeenLastCalledWith(expectedMockListOptions);
  });
});
