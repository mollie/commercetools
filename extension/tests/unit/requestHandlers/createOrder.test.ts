import { v4 as uuid } from 'uuid';
import { mocked } from 'ts-jest/utils';
import { Order } from '@mollie/api-client';
import { createDateNowString, makeMollieAmount } from '../../../src/utils';
// import Logger from '../../../src/logger/logger';
import {
  makeMollieAddress,
  createCtActions,
  extractLocalizedName,
  makeMollieLineCustom,
  makeMollieLine,
  makeMollieLines,
} from '../../../src/requestHandlers/createOrder';

import { CTCart, CTPayment, CTTransactionState, CTTransactionType } from '../../../src/types';

jest.mock('uuid');
jest.mock('../../../src/utils');

describe('makeMollieAddress', () => {
  it('Should properly map address fields', () => {
    const ctAddress = {
      "firstName": "Piet",
      "lastName": "Mondriaan",
      "streetName": "Keizersgracht",
      "streetNumber": "126",
      "postalCode": "1234AB",
      "city": "Amsterdam",
      "country": "NL",
      "email": "coloured_square_lover@basicart.com"
    }
    expect(makeMollieAddress(ctAddress)).toMatchSnapshot()
  });
});

describe('extractLocalizedName', () => {
  it('should extract random localised name when config locale does not match any names given', () => {
    const mockName = {
      en: 'Red dress',
      fr: 'Robe rouge',
    };
    const localizedName = extractLocalizedName(mockName);
    expect(localizedName).toBe('Red dress');
  });

  it('should format an aa-AA formatted locale to ct formatting and find the matching localised name', () => {
    const mockName = {
      en: 'Red dress',
      fr: 'Robe rouge',
      'nl-NL': 'Rode jurk',
    };
    const localizedName = extractLocalizedName(mockName, 'nl_NL');
    expect(localizedName).toBe('Rode jurk');
  });

  it('should transform the locale to ct formatting and find the main language, if the sub language is not present', () => {
    const mockName = {
      en: 'Red dress',
      fr: 'Robe rouge',
      nl: 'Rode jurk',
    };
    const localizedName = extractLocalizedName(mockName, 'nl_NL');
    expect(localizedName).toBe('Rode jurk');
  });
});

describe('makeMollieLineCustom', () => {
  it('Should make correct customLineItem parameters', () => {
    mocked(makeMollieAmount)
      .mockReturnValueOnce({ value: "-1.50", currency: "EUR" }) // unitPrice
      .mockReturnValueOnce({ value: "-1.50", currency: "EUR" }) // totalAmount
      .mockReturnValueOnce({ value: "-0.26", currency: "EUR" }) // vatAmount

    const customLineItem = {
      totalPrice: { currencyCode: 'EUR', centAmount: -150 },
      id: '33025909-90b6-48c6-b885-43feb2c',
      name: { en: 'Giftcard' },
      money: { currencyCode: 'EUR', centAmount: -150 },
      quantity: 1,
      taxRate: { amount: 0.21 },
      taxedPrice: {
        totalNet: { currencyCode: 'EUR', centAmount: -124 },
        totalGross: { currencyCode: 'EUR', centAmount: -150 }
      }
    }
    expect(makeMollieLineCustom(customLineItem, 'en')).toMatchSnapshot()
  });
});

describe('makeMollieLine', () => {
  it('Should make correct lineItem parameters', () => {
    mocked(makeMollieAmount)
      .mockReturnValueOnce({ value: "2.00", currency: "EUR" }) // unitPrice
      .mockReturnValueOnce({ value: "1.42", currency: "EUR" }) // totalAmount
      .mockReturnValueOnce({ value: "0.25", currency: "EUR" }) // vatAmount
      .mockReturnValueOnce({ value: "2.58", currency: "EUR" }) // discountAmount

    const lineItem = {
      id: '5ab4dbee-2e4f-439f-91fd-f1f4bbf1',
      productId: '6fd97a79-c9f4-490e-9eb7-1b502812',
      name: { 'en-US': 'Banana' },
      variant: { sku: '12345' },
      price: {
        value: { currencyCode: 'EUR', centAmount: 200 },
        id: '9af7209c-c43d-4898-9d3d-96e9ba0a1787',
        discounted: { value: { currencyCode: 'EUR', centAmount: 100 } }
      },
      quantity: 2,
      discountedPrice: {
        value: { currencyCode: 'EUR', centAmount: 71 },
        includedDiscounts: [{ discountedAmount: { currencyCode: 'EUR', centAmount: 21 } },
        { discountedAmount: { currencyCode: 'EUR', centAmount: 8 } }]
      },
      taxRate: {
        amount: 0.21,
        includedInPrice: true
      },
      totalPrice: { currencyCode: 'EUR', centAmount: 142, },
      taxedPrice: {
        totalNet: { currencyCode: 'EUR', centAmount: 117, },
        totalGross: { currencyCode: 'EUR', centAmount: 142, }
      },
    }
    expect(makeMollieLine(lineItem, 'en')).toMatchSnapshot()
  });
});

describe('makeMollieLines', () => {
  it('Should combine lineItems and customLineItems in one array', () => {
    const testCart = {
      lineItems: [{}, {}],
      customLineItems: [{}]
    } as CTCart
    const makeMollieLine = jest.fn().mockReturnValue({ name: 'Line Object' })
    const makeMollieLineCustom = jest.fn().mockReturnValueOnce({ name: 'Custom Line Object' })

    expect(makeMollieLines(testCart, 'nl_NL', makeMollieLine, makeMollieLineCustom)).toHaveLength(3)
    expect(makeMollieLine).toHaveBeenCalledTimes(2)
    expect(makeMollieLineCustom).toHaveBeenCalledTimes(1)
  });
});

describe('createCTActions', () => {
  beforeAll(() => {
    const mockUuid = '3fea7470-5434-4056-a829-a187339e94d8';
    mocked(uuid).mockReturnValue(mockUuid);
    mocked(createDateNowString).mockReturnValue('2021-12-15T08:21:15.495Z');
  });

  it('Should create correct ct actions from request and mollies order', async () => {
    const mockedCreateOrderString = '{"locale":"fr_FR"}';
    const mockedCtObject = {
      id: '3d0ede94-df76-423f-b560-71d4c365d086',
      amountPlanned: { centAmount: 500, currencyCode: 'EUR' },
      custom: { fields: { createPayment: mockedCreateOrderString } },
      transactions: [
        {
          id: '949ab89f-7a71-4c7a-bb43-605354322a96',
          state: CTTransactionState.Initial,
          type: CTTransactionType.Charge,
          amount: {
            centAmount: 500,
            currencyCode: 'EUR',
          },
        },
      ],
    };
    const mockedMollieCreatedOrder = {
      resource: 'order',
      id: 'ord_dsczl7',
      profileId: 'pfl_VtWA783A63',
      createdAt: '2018-08-02T09:29:56+00:00',
      amount: { value: '10.00', currency: 'EUR' },
      orderNumber: '1001',
      _embedded: {
        payments: [
          {
            resource: 'payment',
            id: 'tr_2hwPMAs5qU',
            description: 'Order 1001',
            profileId: 'pfl_VtWA783A63',
            orderId: 'ord_ufqybf',
          },
        ],
      },
    } as Order;
    const ctActions = await createCtActions(mockedMollieCreatedOrder, mockedCtObject as CTPayment, 'fd5317fa-c2f8-44c0-85ab-a1c1169d2404');
    expect(ctActions).toHaveLength(6);
    ctActions.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });

  it('Should return an error if cannot find original transaction', async () => {
    const mockedCreateOrderString = '{"orderNumber":"1001"}';
    const mockedCtObject = {
      id: '3d0ede94-df76-423f-b560-71d4c365d086',
      amountPlanned: { centAmount: 500, currencyCode: 'EUR' },
      custom: { fields: { createPayment: mockedCreateOrderString } },
    };
    const mockedMollieCreatedOrder: any = {
      resource: 'order',
      id: 'ord_dsczl7',
      profileId: 'pfl_VtWA783A63',
      amount: { value: '10.00', currency: 'EUR' },
      orderNumber: '1001',
    };
    const expectedError = {
      status: 400,
      title: 'Cannot find original transaction',
      field: 'Payment.transactions',
    };
    await expect(createCtActions(mockedMollieCreatedOrder, mockedCtObject as CTPayment, 'fd5317fa-c2f8-44c0-85ab-a1c1169d2404')).rejects.toEqual(expectedError);
  });

  it('Should return an error if mollie order does not return payments', async () => {
    const mockedCreateOrderString = '{"orderNumber":"1001"}';
    const mockedCtObject = {
      id: '3d0ede94-df76-423f-b560-71d4c365d086',
      amountPlanned: { centAmount: 500, currencyCode: 'EUR' },
      custom: { fields: { createPayment: mockedCreateOrderString } },
      transactions: [{ id: '409400f2-1741-4265-8283-bf23c5f76542', type: 'Charge', state: 'Initial' }],
    };
    const mockedMollieCreatedOrder: any = {
      resource: 'order',
      id: 'ord_dsczl7',
      profileId: 'pfl_VtWA783A63',
      amount: { value: '10.00', currency: 'EUR' },
      orderNumber: '1001',
    };
    const expectedError = {
      field: '<MollieOrder>._embedded.payments.[0].id',
      status: 400,
      title: 'Could not get Mollie payment id.',
    };
    await expect(createCtActions(mockedMollieCreatedOrder, mockedCtObject as CTPayment, 'fd5317fa-c2f8-44c0-85ab-a1c1169d2404')).rejects.toEqual(expectedError);
  });
});

describe.skip('Create orders tests', () => {
  //   const mockLogError = jest.fn();
  //   beforeEach(() => {
  //     Logger.error = mockLogError;
  //     mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  //   });
  //   afterEach(() => {
  //     jest.clearAllMocks();
  //   });
  //   it('Should extract line from CT data', () => {
  //     mocked(convertCTToMollieAmountValue)
  //       .mockReturnValueOnce('10.00') // extractLine:unitPriceValueString
  //       .mockReturnValueOnce('0.00') // extractLine:vatAmount.value
  //       .mockReturnValueOnce('10.00'); // extractLine:totalPriceCT
  //     const mockedCTLine = {
  //       id: '18920',
  //       productId: '90020',
  //       name: {
  //         en: 'apple',
  //       },
  //       variant: {
  //         id: 'appleVariantId',
  //       },
  //       quantity: 1,
  //       vatRate: '0.0',
  //       vatAmount: {
  //         currencyCode: 'EUR',
  //         centAmount: 0,
  //       },
  //       sku: 'SKU1234567',
  //       type: 'physical',
  //       price: {
  //         id: 'applePriceId',
  //         value: {
  //           currencyCode: 'EUR',
  //           centAmount: 1000,
  //         },
  //       },
  //       taxRate: {
  //         amount: 0.2,
  //         includedInPrice: true,
  //       },
  //       taxedPrice: {
  //         totalGross: {
  //           centAmount: 200,
  //           currencyCode: 'EUR',
  //         },
  //         totalNet: {
  //           centAmount: 200,
  //           currencyCode: 'EUR',
  //         },
  //       },
  //       state: [
  //         {
  //           quantity: 1,
  //           state: {
  //             typeId: 'state',
  //             id: 'stateOfApple',
  //           },
  //         },
  //       ],
  //     };
  //     const mockedMollieLine = {
  //       name: 'apple',
  //       quantity: 1,
  //       sku: 'SKU1234567',
  //       type: 'physical',
  //       imageUrl: '',
  //       productUrl: '',
  //       metadata: {},
  //       unitPrice: {
  //         currency: 'EUR',
  //         value: '10.00',
  //       },
  //       totalAmount: {
  //         currency: 'EUR',
  //         value: '10.00',
  //       },
  //       vatRate: '0.00',
  //       vatAmount: {
  //         currency: 'EUR',
  //         value: '0.00',
  //       },
  //     };
  //     expect(extractLine(mockedCTLine)).toMatchObject(mockedMollieLine);
  //   });

  //   it('Should handle quantity >1 and discounts correctly', () => {
  //     mocked(convertCTToMollieAmountValue)
  //       .mockReturnValueOnce('11.00') // extractLine:unitPriceValueString
  //       .mockReturnValueOnce('0.00') // extractLine:vatAmount.value
  //       .mockReturnValueOnce('11.00') // extractLine:discountValue
  //       .mockReturnValueOnce('11.00'); // extractLine:totalPriceCT
  //     const mockedCTLine = {
  //       id: '18920',
  //       productId: '90020',
  //       name: {
  //         en: 'apple',
  //       },
  //       variant: {
  //         id: 'appleVariantId',
  //       },
  //       quantity: 2,
  //       vatRate: '0.0',
  //       vatAmount: {
  //         currencyCode: 'EUR',
  //         centAmount: 0,
  //       },
  //       sku: 'SKU1234567',
  //       type: 'physical',
  //       price: {
  //         id: 'applePriceId',
  //         value: {
  //           currencyCode: 'EUR',
  //           centAmount: 1100,
  //         },
  //       },
  //       discountAmount: {
  //         currencyCode: 'EUR',
  //         centAmount: 1100,
  //       },
  //       taxRate: {
  //         amount: 0.2,
  //         includedInPrice: true,
  //       },
  //       taxedPrice: {
  //         totalGross: {
  //           centAmount: 200,
  //           currencyCode: 'EUR',
  //         },
  //         totalNet: {
  //           centAmount: 200,
  //           currencyCode: 'EUR',
  //         },
  //       },
  //       state: [
  //         {
  //           quantity: 1,
  //           state: {
  //             typeId: 'state',
  //             id: 'stateOfApple',
  //           },
  //         },
  //       ],
  //     };
  //     const mockedMollieLine = {
  //       name: 'apple',
  //       quantity: 2,
  //       sku: 'SKU1234567',
  //       type: 'physical',
  //       imageUrl: '',
  //       productUrl: '',
  //       metadata: {},
  //       unitPrice: {
  //         currency: 'EUR',
  //         value: '11.00',
  //       },
  //       totalAmount: {
  //         currency: 'EUR',
  //         value: '11.00',
  //       },
  //       vatRate: '0.00',
  //       vatAmount: {
  //         currency: 'EUR',
  //         value: '0.00',
  //       },
  //     };
  //     expect(extractLine(mockedCTLine)).toMatchObject(mockedMollieLine);
  //   });
  //   it('Should fill out an order on mollie from CT', async () => {
  //     mocked(convertCTToMollieAmountValue)
  //       .mockReturnValueOnce('10.00') // getCreateOrderParams:amountConverted
  //       .mockReturnValueOnce('10.00') // extractLine:unitPriceValueString
  //       .mockReturnValueOnce('0.00') // extractLine:vatAmount.value
  //       .mockReturnValueOnce('10.00'); // extractLine:totalPriceCT
  //     const mockedCreateOrderRequestFields =
  //       '{"orderNumber":"1001","billingAddress":{"firstName": "Piet", "lastName": "Mondriaan", "email": "coloured_square_lover@basicart.com", "streetName": "Keizersgracht", "streetNumber": "126", "postalCode": "1234AB", "country": "NL", "city": "Amsterdam"},"shippingAddress":{"firstName": "Piet", "lastName": "Mondriaan", "email": "coloured_square_lover@basicart.com", "streetName": "Keizersgracht", "streetNumber": "126", "postalCode": "1234AB", "country": "NL", "city": "Amsterdam"},"orderWebhookUrl":"https://www.examplewebhook.com/","locale":"nl_NL","redirectUrl":"https://www.exampleredirect.com/","lines":[{"id":"18920","productId":"900220","name":{"en":"apple"},"variant":{"id":"294028"},"price":{"id":"lineItemPriceId","value":{"currencyCode":"EUR","centAmount":1000}},"totalPrice":{"currencyCode":"EUR","centAmount":1000},"quantity":1,"vatRate":"0", "vatAmount": { "currencyCode": "EUR", "centAmount": 0 },"shopperCountryMustMatchBillingCountry":true,"state":[{"quantity":1,"state":{"typeId":"state","id":"stateOfApple"}}]}]}';
  //     const mockedCreateOrderRequest = {
  //       custom: { fields: { createOrderRequest: mockedCreateOrderRequestFields } },
  //       amountPlanned: {
  //         currencyCode: 'EUR',
  //         centAmount: 1000,
  //       },
  //       paymentMethodInfo: {
  //         method: 'creditcard',
  //       },
  //     };
  //     const mockedMollieCreateOrderObject = {
  //       amount: { value: '10.00', currency: 'EUR' },
  //       orderNumber: '1001',
  //       webhookUrl: 'https://www.examplewebhook.com/',
  //       locale: 'nl_NL',
  //       redirectUrl: 'https://www.exampleredirect.com/',
  //       method: 'creditcard',
  //       shopperCountryMustMatchBillingCountry: false,
  //       billingAddress: {
  //         streetAndNumber: 'Keizersgracht 126',
  //         city: 'Amsterdam',
  //         postalCode: '1234AB',
  //         country: 'NL',
  //         givenName: 'Piet',
  //         familyName: 'Mondriaan',
  //         email: 'coloured_square_lover@basicart.com',
  //       },
  //       shippingAddress: {
  //         streetAndNumber: 'Keizersgracht 126',
  //         city: 'Amsterdam',
  //         postalCode: '1234AB',
  //         country: 'NL',
  //         givenName: 'Piet',
  //         familyName: 'Mondriaan',
  //         email: 'coloured_square_lover@basicart.com',
  //       },
  //       metadata: {},
  //       lines: [
  //         {
  //           name: 'apple',
  //           quantity: 1,
  //           unitPrice: {
  //             currency: 'EUR',
  //             value: '10.00',
  //           },
  //           totalAmount: {
  //             currency: 'EUR',
  //             value: '10.00',
  //           },
  //           vatRate: '0.00',
  //           vatAmount: {
  //             currency: 'EUR',
  //             value: '0.00',
  //           },
  //         },
  //       ],
  //     };
  //     await expect(getCreateOrderParams(mockedCreateOrderRequest)).resolves.toMatchObject(mockedMollieCreateOrderObject);
  //   });
  //   it('Should return an error if mollie order parameters can not be created', async () => {
  //     const mockedCreateOrderRequest = {
  //       custom: { fields: { createOrderRequest: 'banana' } },
  //     };
  //     const expectedError = { status: 400, title: 'Could not make parameters needed to create Mollie order.', field: 'createOrderRequest' };
  //     await expect(getCreateOrderParams(mockedCreateOrderRequest)).rejects.toEqual(expectedError);
  //     expect(mockLogError).toHaveBeenCalledTimes(1);
  //   });
  //   it('Should fetch the correct billing address from the request body', () => {
  //     const mockedBillingAddressBody = {
  //       firstName: 'Piet',
  //       lastName: 'Mondriaan',
  //       email: 'coloured_square_lover@basicart.com',
  //       streetName: 'Keizersgracht',
  //       streetNumber: '126',
  //       city: 'Amsterdam',
  //       postalCode: '1234AB',
  //       country: 'Netherlands',
  //     };
  //     const mockedPaymentMethod = 'ideal';
  //     const mockedExpectedResponse = {
  //       givenName: 'Piet',
  //       familyName: 'Mondriaan',
  //       email: 'coloured_square_lover@basicart.com',
  //       streetAndNumber: 'Keizersgracht 126',
  //       city: 'Amsterdam',
  //       postalCode: '1234AB',
  //       country: 'Netherlands',
  //     };
  //     expect(getBillingAddress(mockedBillingAddressBody)).toMatchObject(mockedExpectedResponse);
  //     const mockedWrongBillingAddressBody = {
  //       firstName: 'Piet',
  //       streetNumber: '126',
  //       city: 'Amsterdam',
  //       postalCode: '1234AB',
  //       country: 'Netherlands',
  //     };
  //     const mockedWrongExpectedResponse = {
  //       givenName: 'Piet',
  //       familyName: undefined,
  //       email: undefined,
  //       streetAndNumber: '',
  //       city: 'Amsterdam',
  //       postalCode: '1234AB',
  //       country: 'Netherlands',
  //     };
  //     expect(getBillingAddress(mockedWrongBillingAddressBody)).toMatchObject(mockedWrongExpectedResponse);
  //   });
  //   it('Should convert the tax rate from CT -> mollie correctly', () => {
  //     expect(convertCTTaxRateToMollieTaxRate(0.2)).toBe('20.00');
  //     expect(convertCTTaxRateToMollieTaxRate(0)).toBe('0.00');
  //     expect(convertCTTaxRateToMollieTaxRate(0.1775)).toBe('17.75');
  //     expect(convertCTTaxRateToMollieTaxRate(0.40110228)).toBe('40.11');
  //     expect(convertCTTaxRateToMollieTaxRate(-0.2411)).toBe('-24.11');
  //   });
  //   it('Should create correct ct actions from request and mollies order', async () => {
  //     const mockedCreateOrderString = '{"orderNumber":"1001"}';
  //     const mockedCtObject = {
  //       custom: { fields: { createOrderRequest: mockedCreateOrderString } },
  //     };
  //     const mockedMollieCreatedOrder: any = {
  //       resource: 'order',
  //       id: 'ord_dsczl7',
  //       profileId: 'pfl_VtWA783A63',
  //       amount: { value: '10.00', currency: 'EUR' },
  //       orderNumber: '1001',
  //       _embedded: {
  //         payments: [
  //           {
  //             resource: 'payment',
  //             id: 'tr_2hwPMAs5qU',
  //             description: 'Order 1001',
  //             profileId: 'pfl_VtWA783A63',
  //             orderId: 'ord_ufqybf',
  //           },
  //         ],
  //       },
  //     };
  //     const ctActions = await createCtActions(mockedMollieCreatedOrder, mockedCtObject);
  //     ctActions.forEach(action => {
  //       expect(action).toMatchSnapshot();
  //     });
  //   });
  //   it('Should return an error if mollie order does not return payments', async () => {
  //     const mockedCreateOrderString = '{"orderNumber":"1001"}';
  //     const mockedCtObject = {
  //       custom: { fields: { createOrderRequest: mockedCreateOrderString } },
  //     };
  //     const mockedMollieCreatedOrder: any = {
  //       resource: 'order',
  //       id: 'ord_dsczl7',
  //       profileId: 'pfl_VtWA783A63',
  //       amount: { value: '10.00', currency: 'EUR' },
  //       orderNumber: '1001',
  //     };
  //     const expectedError = {
  //       field: '<MollieOrder>._embedded.payments.[0].id',
  //       status: 400,
  //       title: 'Could not get Mollie payment id.',
  //     };
  //     await expect(createCtActions(mockedMollieCreatedOrder, mockedCtObject)).rejects.toEqual(expectedError);
  //   });
  //   it('Should extract the correct shipping address from the request body', () => {
  //     const mockedShippingAddressBody = {
  //       firstName: 'Piet',
  //       lastName: 'Mondriaan',
  //       email: 'coloured_square_lover@basicart.com',
  //       streetName: 'Keizersgracht',
  //       streetNumber: '126',
  //       city: 'Amsterdam',
  //       postalCode: '1234AB',
  //       country: 'Netherlands',
  //     };
  //     const mockedExpectedResponse = {
  //       givenName: 'Piet',
  //       familyName: 'Mondriaan',
  //       email: 'coloured_square_lover@basicart.com',
  //       streetAndNumber: 'Keizersgracht 126',
  //       city: 'Amsterdam',
  //       postalCode: '1234AB',
  //       country: 'Netherlands',
  //     };
  //     expect(getShippingAddress(mockedShippingAddressBody)).toMatchObject(mockedExpectedResponse);
  //   });
  //   it('Should validate the discount amount object', () => {
  //     expect(isDiscountAmountValid({ currencyCode: 'EUR', centAmount: 2000 })).toBeTruthy();
  //   });
});
