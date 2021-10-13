import { fillOrderValues, extractLine } from '../src/requestHandlers/createOrder';
import { Request } from 'express';

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
      taxRate: '00.00',
      price: {
        id: 'applePriceId',
        value: {
          currencyCode: 'EUR',
          centAmount: 1000,
        },
      },
      totalPrice: {
        currencyCode: 'EUR',
        centAmount: 1000,
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
      unitPrice: {
        currency: 'EUR',
        value: '10.00',
      },
      totalAmount: {
        currency: 'EUR',
        value: '10.00',
      },
      vatRate: '00.00',
      vatAmount: {
        currency: 'EUR',
        value: '0.00',
      },
    };
    expect(extractLine(mockedCTLine)).toMatchObject(mockedMollieLine);
  });
  it('Should fill out an order on mollie from CT', async () => {
    const mockedCreateOrderRequestFields =
      '{"orderNumber":"1001","orderWebhookUrl":"https://www.examplewebhook.com/","locale":"nl_NL","redirectUrl":"https://www.exampleredirect.com/","lines":[{"id":"18920","productId":"900220","name":{"en":"apple"},"variant":{"id":"294028"},"price":{"id":"lineItemPriceId","value":{"currencyCode":"EUR","centAmount":1000}},"totalPrice":{"currencyCode":"EUR","centAmount":1000},"quantity":1,"taxRate":"00.00","shopperCountryMustMatchBillingCountry":true,"state":[{"quantity":1,"state":{"typeId":"state","id":"stateOfApple"}}]}]}';
    const mockedCreateOrderRequest = {
      resource: {
        obj: {
          custom: { fields: { createOrderRequest: mockedCreateOrderRequestFields } },
          amountPlanned: {
            currencyCode: 'EUR',
            centAmount: 1000,
          },
          paymentMethodInfo: {
            method: 'CREDIT_CARD',
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
        email: 'piet@mondriaan.com',
      },
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
          vatRate: '00.00',
          vatAmount: {
            currency: 'EUR',
            value: '0.00',
          },
        },
      ],
    };
    expect(fillOrderValues(mockedCreateOrderRequest)).toMatchObject(mockedMollieCreateOrderObject);
  });
});
