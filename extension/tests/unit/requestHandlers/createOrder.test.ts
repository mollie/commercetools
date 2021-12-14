// import { mocked } from 'ts-jest/utils';
// import { createDateNowString, convertCTToMollieAmountValue } from '../../../src/utils';
// import Logger from '../../../src/logger/logger';
import {
  // getCreateOrderParams,
  // extractLine,
  formatPaymentMethods,
  // getBillingAddress,
  // createCtActions,
  // getShippingAddress,
  // isDiscountAmountValid,
  // convertCTTaxRateToMollieTaxRate,
} from '../../../src/requestHandlers/createOrder';

// jest.mock('../../../src/utils');

describe('formatPaymentMethods', () => {
  it('should return a string when passed one payment method', () => {
    const method = formatPaymentMethods('sofort');
    expect(method).toBe('sofort');
  });
  it('should return an array when passed multiple payment methods', () => {
    const method = formatPaymentMethods('sofort,applepay,klarnapaylater,giropay');
    expect(method).toEqual(['sofort', 'applepay', 'klarnapaylater', 'giropay']);
  });
  it('should return empty string when passed invalid payment method(s)', () => {
    const method = formatPaymentMethods('apple,klarna');
    expect(method).toEqual('');
  });
  it('should return correct PaymentMethods when voucher or mybank is present', () => {
    const method = formatPaymentMethods('voucher,paysafecard,applepay,mybank,payfriend');
    expect(method).toEqual(['voucher', 'paysafecard', 'applepay', 'mybank']);
  });
});

// describe.skip('Create orders tests', () => {
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
//   it('Should invalidate the wrong discount amount object', () => {
//     expect(isDiscountAmountValid({ centAmount: 2000 })).toBeFalsy();
//   });
// });
