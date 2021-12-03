import { Amount } from '@mollie/api-client/dist/types/src/data/global';
import { ControllerAction } from '../src/types';
import * as ut from '../src/utils';
import { convertMollieAmountToCTMoney } from '../src/utils';

describe('Utils', () => {
  beforeAll(() => {
    jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => '2021-11-10T14:02:45.858Z');
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('methodListMapper', () => {
    it('Should return empty object if no amountPlanned / use as list all', async () => {
      const mollieOptions = ut.methodListMapper({});
      expect(mollieOptions).toMatchObject({});
    });

    it('Should return properly formated amount for mollie', async () => {
      const ctObj = {
        amountPlanned: {
          currencyCode: 'USD',
          centAmount: 1234,
        },
      };

      const mollieOptions = ut.methodListMapper(ctObj);
      expect(mollieOptions.amount).toHaveProperty('value', '12.34');
      expect(mollieOptions.amount).toHaveProperty('currency', 'USD');
    });

    it('Should return properly formated custom fields for mollie', async () => {
      const ctObj = {
        amountPlanned: {
          currencyCode: 'EUR',
          centAmount: 100987,
          fractionDigits: 4,
        },
        custom: {
          fields: {
            paymentMethodsRequest: '{"locale":"nl_NL","billingCountry":"NL","includeWallets":"applepay","orderLineCategories":"eco,meal","issuers":false,"pricing":false}',
          },
        },
      };
      const expectedOptions = {
        amount: {
          value: '10.10',
          currency: 'EUR',
        },
        locale: 'nl_NL',
        billingCountry: 'NL',
        includeWallets: 'applepay',
        orderLineCategories: 'eco,meal',
        resource: 'orders',
      };

      const mollieOptions = ut.methodListMapper(ctObj);
      expect(mollieOptions).toEqual(expectedOptions);
    });

    it('Should properly parse includes and not have unprovided fields', async () => {
      const ctObj = {
        amountPlanned: {
          currencyCode: 'EUR',
          centAmount: 1000,
        },
        custom: {
          fields: {
            paymentMethodsRequest: '{"locale":"nl_NL","issuers":false,"pricing":true}',
          },
        },
      };

      const mollieOptions = ut.methodListMapper(ctObj);
      expect(mollieOptions).toHaveProperty('locale', 'nl_NL');
      expect(mollieOptions).toHaveProperty('include', 'pricing');
      expect(mollieOptions.billingCountry).toBeUndefined();
    });
  });

  describe('makeMollieLineAmounts', () => {
    it('Should transform commercetools money to mollie amount object on lines', () => {
      const mockedLines = [
        {
          id: '1',
          amount: {
            fractionDigits: 2,
            currencyCode: 'EUR',
            centAmount: 1800,
          },
        },
      ];
      const expectedResult = [
        {
          id: '1',
          amount: {
            currency: 'EUR',
            value: '18.00',
          },
        },
      ];
      const transformedLineAmounts = ut.makeMollieLineAmounts(mockedLines);
      expect(transformedLineAmounts).toEqual(expectedResult);
    });
    it('Should not fail if no amounts are present', () => {
      const mockedLines = [
        {
          id: '1',
          name: 'apple',
        },
      ];
      const expectedResult = [
        {
          id: '1',
          name: 'apple',
        },
      ];
      const transformedLineAmounts = ut.makeMollieLineAmounts(mockedLines);
      expect(transformedLineAmounts).toEqual(expectedResult);
    });
  });

  describe('isMoliePaymentInterface', () => {
    it('must return true when payment interface is mollie', () => {
      const mockedCtObject = {
        paymentMethodInfo: {
          paymentInterface: 'Mollie',
        },
      };
      expect(ut.isMoliePaymentInterface(mockedCtObject)).toBe(true);
    });
    it('should return false if payment interface is not mollie', () => {
      const mockedCtObject = {
        paymentMethodInfo: {
          paymentInterface: 'NotMollie',
        },
      };
      expect(ut.isMoliePaymentInterface(mockedCtObject)).toBe(false);
    });
    it('should return false if payment interface is not set', () => {
      const mockedCtObject = {
        paymentMethodInfo: {},
      };
      expect(ut.isMoliePaymentInterface(mockedCtObject)).toBe(false);
    });
  });

  describe('makeActions', () => {
    const makeActions = ut.makeActions;

    it('should return setCustomField action with correct values', () => {
      const setCustomField = makeActions.setCustomField('mollieOrderStatus', 'created');
      expect(setCustomField).toEqual({
        action: 'setCustomField',
        name: 'mollieOrderStatus',
        value: 'created',
      });
    });

    it('should return addInterfaceInteraction with correct values', () => {
      const addInterfaceInteraction = makeActions.addInterfaceInteraction(ControllerAction.GetPaymentMethods, '{}', '"count": 5, "methods": [ "creditcard"]');
      expect(addInterfaceInteraction).toEqual({
        action: 'addInterfaceInteraction',
        type: {
          key: 'ct-mollie-integration-interface-interaction-type',
        },
        fields: {
          actionType: ControllerAction.GetPaymentMethods,
          createdAt: '2021-11-10T14:02:45.858Z',
          request: '{}',
          response: '"count": 5, "methods": [ "creditcard"]',
        },
      });
    });
  });
});
describe('convertMollieToCTPaymentAmount', () => {
  it('should return correct centAmount from mollie payment amount', () => {
    const testCases = [
      { mollieAmount: '10.00', expectedCentAmount: 1000 },
      { mollieAmount: '-15.00', expectedCentAmount: -1500 },
      { mollieAmount: '0.50', expectedCentAmount: 50 },
      { mollieAmount: '-19.99', expectedCentAmount: -1999 },
      { mollieAmount: '0.01', expectedCentAmount: 1 },
    ];
    testCases.forEach(({ mollieAmount, expectedCentAmount }) => {
      const expectedResult = {
        currencyCode: 'EUR',
        centAmount: expectedCentAmount,
        fractionDigits: 2,
        type: 'centPrecision',
      };
      expect(convertMollieAmountToCTMoney({ value: mollieAmount, currency: 'EUR' } as Amount)).toStrictEqual(expectedResult);
      const expectedResult2 = { currencyCode: 'USD', centAmount: -9, fractionDigits: 1, type: 'centPrecision' };
      expect(convertMollieAmountToCTMoney({ value: '-0.9', currency: 'USD' } as Amount)).toStrictEqual(expectedResult2);
      const expectedResult3 = { currencyCode: 'USD', centAmount: -995, fractionDigits: 6, type: 'centPrecision' };
      expect(convertMollieAmountToCTMoney({ value: '-0.000995', currency: 'USD' } as Amount)).toStrictEqual(expectedResult3);
    });
  });
  it('should return correct centAmount with currency without digits', () => {
    const expectedResult = { currencyCode: 'ISK', centAmount: 1050, fractionDigits: 0, type: 'centPrecision' };
    expect(convertMollieAmountToCTMoney({ value: '1050', currency: 'ISK' } as Amount)).toStrictEqual(expectedResult);
  });
});
