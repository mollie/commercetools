import { v4 as uuid } from 'uuid';
import { mocked } from 'ts-jest/utils';
import { Order, OrderLineType } from '@mollie/api-client';
import { cloneDeep, omit } from 'lodash';
import { makeMollieAmount } from '../../../src/utils';
import Logger from '../../../src/logger/logger';
import createOrder, {
  makeMollieAddress,
  createCtActions,
  makeMollieLineShipping,
  extractLocalizedName,
  makeMollieLineCustom,
  makeMollieLine,
  makeMollieLines,
  getCreateOrderParams,
} from '../../../src/requestHandlers/createOrder';

import { CTCart, CTLineItem, CTPayment, CTTransactionState, CTTransactionType } from '../../../src/types';
import { mollieCreateOrderParams, mollieOrder, ctCart, ctPayment, ctLineItem, ctAddress, extensionActions } from './constants';

jest.mock('uuid');
jest.mock('../../../src/utils');

describe('makeMollieAddress', () => {
  it('Should properly map address fields', () => {
    expect(makeMollieAddress(ctAddress)).toMatchSnapshot();
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
      .mockReturnValueOnce({ value: '-1.50', currency: 'EUR' }) // unitPrice
      .mockReturnValueOnce({ value: '-1.50', currency: 'EUR' }) // totalAmount
      .mockReturnValueOnce({ value: '-0.26', currency: 'EUR' }); // vatAmount

    const customLineItem = {
      totalPrice: { currencyCode: 'EUR', centAmount: -150 },
      id: '33025909-90b6-48c6-b885-43feb2c',
      name: { en: 'Giftcard' },
      money: { currencyCode: 'EUR', centAmount: -150 },
      quantity: 1,
      taxRate: { amount: 0.21 },
      taxedPrice: {
        totalNet: { currencyCode: 'EUR', centAmount: -124 },
        totalGross: { currencyCode: 'EUR', centAmount: -150 },
      },
    };
    expect(makeMollieLineCustom(customLineItem, 'en')).toMatchSnapshot();
  });
});

describe('makeMollieLine', () => {
  it('Should make correct lineItem parameters', () => {
    mocked(makeMollieAmount)
      .mockReturnValueOnce({ value: '2.00', currency: 'EUR' }) // unitPrice
      .mockReturnValueOnce({ value: '1.42', currency: 'EUR' }) // totalAmount
      .mockReturnValueOnce({ value: '0.25', currency: 'EUR' }) // vatAmount
      .mockReturnValueOnce({ value: '2.58', currency: 'EUR' }); // discountAmount

    expect(makeMollieLine(ctLineItem as CTLineItem, 'en')).toMatchSnapshot();
  });
});

describe('makeMollieLines', () => {
  it('Should combine lineItems and customLineItems in one array', () => {
    const testCart = {
      lineItems: [{}, {}],
      customLineItems: [{}],
    } as CTCart;
    const makeMollieLine = jest.fn().mockReturnValue({ name: 'Line Object' });
    const makeMollieLineCustom = jest.fn().mockReturnValueOnce({ name: 'Custom Line Object' });

    expect(makeMollieLines(testCart, 'nl_NL', makeMollieLine, makeMollieLineCustom)).toHaveLength(3);
    expect(makeMollieLine).toHaveBeenCalledTimes(2);
    expect(makeMollieLineCustom).toHaveBeenCalledTimes(1);
  });
});

describe('getCreateOrderParams', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should make create order parameters', async () => {
    mocked(makeMollieAmount)
      .mockReturnValueOnce({ value: '7.04', currency: 'EUR' })
      .mockReturnValueOnce({ value: '2.00', currency: 'EUR' })
      .mockReturnValueOnce({ value: '1.42', currency: 'EUR' })
      .mockReturnValueOnce({ value: '0.25', currency: 'EUR' })
      .mockReturnValueOnce({ value: '2.58', currency: 'EUR' })
      .mockReturnValueOnce({ value: '2.50', currency: 'EUR' })
      .mockReturnValueOnce({ value: '7.12', currency: 'EUR' })
      .mockReturnValueOnce({ value: '1.24', currency: 'EUR' })
      .mockReturnValueOnce({ value: '2.88', currency: 'EUR' })
      .mockReturnValueOnce({ value: '-1.50', currency: 'EUR' })
      .mockReturnValueOnce({ value: '-1.50', currency: 'EUR' })
      .mockReturnValueOnce({ value: '-0.26', currency: 'EUR' });

    await expect(getCreateOrderParams(ctPayment as CTPayment, ctCart as CTCart)).resolves.toMatchObject(mollieCreateOrderParams);
  });
  it('Should return error if no billing address on cart', async () => {
    const expectedError = {
      field: 'cart.billingAddress',
      status: 400,
      title: 'Cart associated with this payment is missing billingAddress',
    };

    await expect(getCreateOrderParams(ctPayment as CTPayment, omit(ctCart, 'billingAddress') as CTCart)).rejects.toMatchObject(expectedError);
  });
  it('Should return error if parsing of createPayment fails', async () => {
    const ctPaymentBadJson = cloneDeep(ctPayment);
    ctPaymentBadJson.custom.fields.createPayment = 'unparsable JSON';
    const expectedError = { status: 400, title: 'Could not make parameters needed to create Mollie order.', field: 'createPayment' };

    await expect(getCreateOrderParams(ctPaymentBadJson as CTPayment, ctCart as CTCart)).rejects.toMatchObject(expectedError);
  });
});

describe('createCTActions', () => {
  beforeAll(() => {
    const mockUuid = '3fea7470-5434-4056-a829-a187339e94d8';
    mocked(uuid).mockReturnValue(mockUuid);
    // mocked(createDateNowString).mockReturnValue('2021-12-15T08:21:15.495Z');
    jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => '2021-12-15T08:21:15.495Z');
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

describe('makeMollieLines - shipping', () => {
  const shippingInfoWithDiscount = {
    shippingMethodName: 'Express EU',
    price: {
      type: 'centPrecision',
      currencyCode: 'EUR',
      centAmount: 1000,
      fractionDigits: 2,
    },
    taxRate: {
      name: '21% incl.',
      amount: 0.21,
      includedInPrice: true,
      country: 'NL',
      id: '0gSSkVZl',
      subRates: [],
    },
    discountedPrice: {
      value: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 0,
        fractionDigits: 2,
      },
      includedDiscounts: [
        {
          discount: {
            typeId: 'cart-discount',
            id: '1f584b1f-b6ea-414f-87b7-0c58f8c15f78',
          },
          discountedAmount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 1000,
            fractionDigits: 2,
          },
        },
      ],
    },
    taxedPrice: {
      totalNet: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 0,
        fractionDigits: 2,
      },
      totalGross: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 0,
        fractionDigits: 2,
      },
    },
  };
  const shippingInfo = {
    shippingMethodName: 'Express EU',
    price: {
      type: 'centPrecision',
      currencyCode: 'EUR',
      centAmount: 1000,
      fractionDigits: 2,
    },
    taxRate: {
      name: '21% incl.',
      amount: 0.21,
      includedInPrice: true,
      country: 'NL',
      id: '0gSSkVZl',
      subRates: [],
    },
    taxedPrice: {
      totalNet: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 826,
        fractionDigits: 2,
      },
      totalGross: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 1000,
        fractionDigits: 2,
      },
    },
  };

  it('should create mollie order line for shipping with correct amount', () => {
    mocked(makeMollieAmount).mockReturnValueOnce({ value: '10.00', currency: 'EUR' }).mockReturnValueOnce({ value: '10.00', currency: 'EUR' }).mockReturnValueOnce({ value: '1.74', currency: 'EUR' });
    const orderLine = makeMollieLineShipping(shippingInfo);
    expect(orderLine).toEqual({
      type: OrderLineType.shipping_fee,
      name: 'Shipping - Express EU',
      quantity: 1,
      unitPrice: {
        currency: 'EUR',
        value: '10.00',
      },
      totalAmount: {
        currency: 'EUR',
        value: '10.00',
      },
      vatRate: '21.00',
      vatAmount: {
        currency: 'EUR',
        value: '1.74',
      },
    });
  });

  it('should create mollie order line for shipping and handle discount amount', () => {
    mocked(makeMollieAmount)
      .mockReturnValueOnce({ value: '10.00', currency: 'EUR' })
      .mockReturnValueOnce({ value: '0.00', currency: 'EUR' })
      .mockReturnValueOnce({ value: '0.00', currency: 'EUR' })
      .mockReturnValueOnce({ value: '10.00', currency: 'EUR' });
    const orderLine = makeMollieLineShipping(shippingInfoWithDiscount);
    expect(orderLine).toEqual({
      type: OrderLineType.shipping_fee,
      name: 'Shipping - Express EU',
      quantity: 1,
      unitPrice: {
        currency: 'EUR',
        value: '10.00',
      },
      totalAmount: {
        currency: 'EUR',
        value: '0.00',
      },
      vatRate: '21.00',
      vatAmount: {
        currency: 'EUR',
        value: '0.00',
      },
      discountAmount: {
        currency: 'EUR',
        value: '10.00',
      },
    });
  });
});

describe('createOrder', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Returns an array of actions on success', async () => {
    const commercetoolsClient = { execute: jest.fn().mockResolvedValueOnce({ body: { results: [ctCart] } }) };
    const getCreateOrderParams = jest.fn().mockResolvedValueOnce(mollieCreateOrderParams);
    const createOrderActions = jest.fn().mockResolvedValueOnce(extensionActions);
    const mollieClient = { orders: { create: jest.fn().mockResolvedValueOnce(mollieOrder) } } as any;
    const expectedResult = {
      actions: extensionActions,
      status: 201,
    };

    await expect(createOrder(ctPayment as CTPayment, mollieClient, commercetoolsClient, getCreateOrderParams, createOrderActions)).resolves.toMatchObject(expectedResult);
  });
  it('Returns an error if call to commercetools carts fails', async () => {
    const mockedError = { status: 503, message: 'Service unavailable', code: 503 };
    const commercetoolsClient = { execute: jest.fn().mockRejectedValueOnce(mockedError) } as any;
    const mollieClient = {} as any;
    const expectedError = {
      status: 400,
      errors: [
        {
          code: 'General',
          message: 'Service unavailable',
          extensionExtraInfo: { originalStatusCode: 503 },
        },
      ],
    };

    await expect(
      createOrder(
        ctPayment as CTPayment,
        mollieClient,
        commercetoolsClient,
        () => {},
        () => {},
      ),
    ).resolves.toMatchObject(expectedError);
  });
  it('Returns an error if commercetools cart is not found', async () => {
    const mockedNoCart = { body: { results: [] } };
    const commercetoolsClient = { execute: jest.fn().mockResolvedValueOnce(mockedNoCart) } as any;
    const mollieClient = {} as any;
    const expectedError = {
      status: 400,
      errors: [
        {
          code: 'ObjectNotFound',
          message: 'Could not find Cart associated with the payment 95437342-d64f-4bfb-bc4e-eed6f1769d2e.',
          extensionExtraInfo: { originalStatusCode: 404 },
        },
      ],
    };

    await expect(
      createOrder(
        ctPayment as CTPayment,
        mollieClient,
        commercetoolsClient,
        () => {},
        () => {},
      ),
    ).resolves.toMatchObject(expectedError);
  });
});
