import {
  fillOrderValues,
  extractLine,
  CTPaymentMethodToMolliePaymentMethod,
  getBillingAddress,
  convertCTTaxRateToMollieTaxRate,
  getShippingAddress,
  isDiscountAmountValid,
} from '../src/requestHandlers/createOrder';
import { PaymentMethod } from '@mollie/api-client';

describe('Create orders tests', () => {
  it('Should extract line from CT data', () => {
    const mockedCTLine = {
      id: '18920',
      productId: '90020',
      name: {
        en: 'apple',
      },
      variant: {
        id: 'appleVariantId',
      },
      quantity: 1,
      vatRate: '0.0',
      vatAmount: {
        currencyCode: 'EUR',
        centAmount: 0,
      },
      sku: 'SKU1234567',
      type: 'physical',
      price: {
        id: 'applePriceId',
        value: {
          currencyCode: 'EUR',
          centAmount: 1000,
        },
      },
      totalPrice: {
        currencyCode: 'EUR',
        centAmount: 1200,
      },
      taxRate: {
        amount: 0.2,
        includedInPrice: true,
      },
      taxedPrice: {
        totalGross: {
          centAmount: 200,
          currencyCode: 'EUR',
        },
        totalNet: {
          centAmount: 200,
          currencyCode: 'EUR',
        },
      },
      state: [
        {
          quantity: 1,
          state: {
            typeId: 'state',
            id: 'stateOfApple',
          },
        },
      ],
    };
    const mockedMollieLine = {
      name: 'apple',
      quantity: 1,
      sku: 'SKU1234567',
      type: 'physical',
      imageUrl: '',
      productUrl: '',
      metadata: {},
      unitPrice: {
        currency: 'EUR',
        value: '10.00',
      },
      totalAmount: {
        currency: 'EUR',
        value: '12.00',
      },
      vatRate: '0.00',
      vatAmount: {
        currency: 'EUR',
        value: '0.00',
      },
    };
    expect(extractLine(mockedCTLine)).toMatchObject(mockedMollieLine);
  });
  it('Should fill out an order on mollie from CT', async () => {
    const mockedCreateOrderRequestFields =
      '{"orderNumber":"1001","billingAddress":{"firstName": "Piet", "lastName": "Mondriaan", "email": "coloured_square_lover@basicart.com", "streetName": "Keizersgracht", "streetNumber": "126", "postalCode": "1234AB", "country": "NL", "city": "Amsterdam"},"shippingAddress":{"firstName": "Piet", "lastName": "Mondriaan", "email": "coloured_square_lover@basicart.com", "streetName": "Keizersgracht", "streetNumber": "126", "postalCode": "1234AB", "country": "NL", "city": "Amsterdam"},"orderWebhookUrl":"https://www.examplewebhook.com/","locale":"nl_NL","redirectUrl":"https://www.exampleredirect.com/","lines":[{"id":"18920","productId":"900220","name":{"en":"apple"},"variant":{"id":"294028"},"price":{"id":"lineItemPriceId","value":{"currencyCode":"EUR","centAmount":1000}},"totalPrice":{"currencyCode":"EUR","centAmount":1000},"quantity":1,"vatRate":"0", "vatAmount": { "currencyCode": "EUR", "centAmount": 0 },"shopperCountryMustMatchBillingCountry":true,"state":[{"quantity":1,"state":{"typeId":"state","id":"stateOfApple"}}]}]}';
    const mockedCreateOrderRequest = {
      resource: {
        obj: {
          custom: { fields: { createOrderRequest: mockedCreateOrderRequestFields } },
          amountPlanned: {
            currencyCode: 'EUR',
            centAmount: 1000,
          },
          paymentMethodInfo: {
            method: 'creditcard',
          },
        },
      },
    };
    const mockedMollieCreateOrderObject = {
      amount: { value: '10.00', currency: 'EUR' },
      orderNumber: '1001',
      webhookUrl: 'https://www.examplewebhook.com/',
      locale: 'nl_NL',
      redirectUrl: 'https://www.exampleredirect.com/',
      method: 'creditcard',
      shopperCountryMustMatchBillingCountry: false,
      billingAddress: {
        streetAndNumber: 'Keizersgracht 126',
        city: 'Amsterdam',
        postalCode: '1234AB',
        country: 'NL',
        givenName: 'Piet',
        familyName: 'Mondriaan',
        email: 'coloured_square_lover@basicart.com',
      },
      shippingAddress: {
        streetAndNumber: 'Keizersgracht 126',
        city: 'Amsterdam',
        postalCode: '1234AB',
        country: 'NL',
        givenName: 'Piet',
        familyName: 'Mondriaan',
        email: 'coloured_square_lover@basicart.com',
      },
      metadata: {},
      lines: [
        {
          name: 'apple',
          quantity: 1,
          unitPrice: {
            currency: 'EUR',
            value: '10.00',
          },
          totalAmount: {
            currency: 'EUR',
            value: '10.00',
          },
          vatRate: '0.00',
          vatAmount: {
            currency: 'EUR',
            value: '0.00',
          },
        },
      ],
    };
    expect(fillOrderValues(mockedCreateOrderRequest)).toMatchObject(mockedMollieCreateOrderObject);
  });
  it('Should return the correct mollie payment method', () => {
    expect(CTPaymentMethodToMolliePaymentMethod('sofort')).toMatch(PaymentMethod.sofort);
    expect(CTPaymentMethodToMolliePaymentMethod('ideal')).toMatch(PaymentMethod.ideal);
  });
  it('Should error on incorrect payment method', () => {
    expect(CTPaymentMethodToMolliePaymentMethod('banana')).toMatch('');
  });
  it('Should fetch the correct billing address from the request body', () => {
    const mockedBillingAddressBody = {
      firstName: 'Piet',
      lastName: 'Mondriaan',
      email: 'coloured_square_lover@basicart.com',
      streetName: 'Keizersgracht',
      streetNumber: '126',
      city: 'Amsterdam',
      postalCode: '1234AB',
      country: 'Netherlands',
    };
    const mockedPaymentMethod = 'ideal';
    const mockedExpectedResponse = {
      givenName: 'Piet',
      familyName: 'Mondriaan',
      email: 'coloured_square_lover@basicart.com',
      streetAndNumber: 'Keizersgracht 126',
      city: 'Amsterdam',
      postalCode: '1234AB',
      country: 'Netherlands',
    };
    expect(getBillingAddress(mockedBillingAddressBody)).toMatchObject(mockedExpectedResponse);
    const mockedWrongBillingAddressBody = {
      firstName: 'Piet',
      streetNumber: '126',
      city: 'Amsterdam',
      postalCode: '1234AB',
      country: 'Netherlands',
    };
    const mockedWrongExpectedResponse = {
      givenName: 'Piet',
      familyName: undefined,
      email: undefined,
      streetAndNumber: '',
      city: 'Amsterdam',
      postalCode: '1234AB',
      country: 'Netherlands',
    };
    expect(getBillingAddress(mockedWrongBillingAddressBody)).toMatchObject(mockedWrongExpectedResponse);
  });
  it('Should convert the tax rate from CT -> mollie correctly', () => {
    expect(convertCTTaxRateToMollieTaxRate(0.2)).toBe('20.00');
    expect(convertCTTaxRateToMollieTaxRate(0)).toBe('0.00');
    expect(convertCTTaxRateToMollieTaxRate(0.1775)).toBe('17.75');
    expect(convertCTTaxRateToMollieTaxRate(0.40110228)).toBe('40.11');
    expect(convertCTTaxRateToMollieTaxRate(-0.2411)).toBe('-24.11');
  });
  it('Should extract the correct shipping address from the request body', () => {
    const mockedShippingAddressBody = {
      firstName: 'Piet',
      lastName: 'Mondriaan',
      email: 'coloured_square_lover@basicart.com',
      streetName: 'Keizersgracht',
      streetNumber: '126',
      city: 'Amsterdam',
      postalCode: '1234AB',
      country: 'Netherlands',
    };
    const mockedExpectedResponse = {
      givenName: 'Piet',
      familyName: 'Mondriaan',
      email: 'coloured_square_lover@basicart.com',
      streetAndNumber: 'Keizersgracht 126',
      city: 'Amsterdam',
      postalCode: '1234AB',
      country: 'Netherlands',
    };
    expect(getShippingAddress(mockedShippingAddressBody)).toMatchObject(mockedExpectedResponse);
  });
  it('Should validate the discount amount object', () => {
    expect(isDiscountAmountValid({ currency: 'EUR', value: 2000 })).toBeTruthy();
  });
});
